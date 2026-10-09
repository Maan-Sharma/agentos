import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import Fastify, { type FastifyError } from "fastify";

import { config } from "./config.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { agentRoutes } from "./modules/agents/agent.routes.js";
import { executionRoutes } from "./modules/executions/execution.routes.js";

export async function createApp() {
  const app = Fastify({
    logger: {
      level: config.LOG_LEVEL,
    },
  });

  app.setErrorHandler<FastifyError>((error, request, reply) => {
    const statusCode =
      typeof error.statusCode === "number" && error.statusCode >= 400 && error.statusCode < 600
        ? error.statusCode
        : 500;

    if (statusCode >= 500) {
      request.log.error({ err: error }, "Request failed");
      return reply.status(statusCode).send({ error: "Internal server error" });
    }

    const details = error.validation?.map(({ instancePath, message }) => ({
      path: instancePath,
      message,
    }));

    return reply.status(statusCode).send({
      error: error.message,
      ...(details?.length ? { details } : {}),
    });
  });

  await app.register(cors, {
    origin: config.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });
  await app.register(cookie);
  await app.register(rateLimit, {
    global: false,
  });
  app.decorateRequest("authContext", null);

  app.get("/api/v1/health", async () => ({
    status: "ok",
    service: "agentos-api",
  }));

  await app.register(authRoutes);
  await app.register(agentRoutes);
  await app.register(executionRoutes);
  return app;
}
