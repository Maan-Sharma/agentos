import { db } from "../../db/index.js";
import { agents } from "../../db/schema.js";
import type { CreateAgentInput } from "./agent.schema.js";

export async function createAgent(input: CreateAgentInput) {
  const [agent] = await db
    .insert(agents)
    .values({
      name: input.name,
      description: input.description ?? null,
      instructions: input.instructions,
      model: input.model,
      status: input.status,
    })
    .returning();

  return agent;
}

export async function getAgents() {
  return db.select().from(agents);
}