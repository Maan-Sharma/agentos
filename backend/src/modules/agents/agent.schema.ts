import { z } from "zod";
import { agentStatus } from "../../db/schema.js";

export const createAgentSchema = z.object({
  name: z
    .string()
    .min(2, "Agent name must be at least 2 characters")
    .max(120),

  description: z
    .string()
    .max(500)
    .optional(),

  instructions: z
    .string()
    .min(1, "Instructions are required"),

  model: z
    .string()
    .default("gpt-5.6"),

  status: z
    .enum(agentStatus.enumValues)
    .default("inactive"),
});

export type CreateAgentInput = z.infer<typeof createAgentSchema>;