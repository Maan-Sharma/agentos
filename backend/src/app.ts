import "dotenv/config";
import cors from "@fastify/cors";
import Fastify from "fastify";

import { agentRoutes } from "./modules/agents/agent.routes.js";

export async function createApp() {
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, {
    origin: true,
  });

  app.get("/api/v1/health", async () => ({
    status: "ok",
    service: "agentos-api",
  }));

  await app.register(agentRoutes);
  return app;
}
