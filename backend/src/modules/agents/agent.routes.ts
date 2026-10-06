import type { FastifyInstance } from "fastify";

import { createAgentSchema } from "./agent.schema.js";
import { createAgent, getAgents } from "./agent.service.js";

export async function agentRoutes(app: FastifyInstance) {
  app.post("/api/v1/agents", async (request, reply) => {
    const result = createAgentSchema.safeParse(request.body);

    if (!result.success) {
      return reply.status(400).send({
        error: "Invalid agent data",
        details: result.error.flatten(),
      });
    }

    const agent = await createAgent(result.data);

    return reply.status(201).send({
      agent,
    });
  });
  app.get("/api/v1/agents", async () => {
    const agents = await getAgents();

    return {
      agents,
    };
  });
}
