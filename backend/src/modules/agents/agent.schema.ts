import { z } from "zod";
import { agentProvider, agentRole, agentStatus } from "../../db/schema.js";

const name = z.string().trim().min(2, "Agent name must be at least 2 characters").max(120);
const externalId = z.string().trim().min(1).max(120).nullable();
const description = z.string().trim().max(500).nullable();
const instructions = z.string().trim().min(1, "Instructions are required").max(10000);
const model = z.string().trim().min(1, "Model is required").max(100);
const provider = z.enum(agentProvider.enumValues);
const role = z.enum(agentRole.enumValues);
const temperature = z.number().finite().min(0).max(2);
const maxTokensPerRun = z.number().int().min(1).max(1_000_000);
const monthlyBudgetUsd = z.number().finite().min(0).nullable();

export const createAgentSchema = z.object({
  name,
  externalId: externalId.optional(),
  description: description.optional(),
  instructions: instructions.default("No custom instructions configured."),
  provider: provider.default("openai"),
  model: model.default("gpt-5.6"),
  role: role.default("other"),
  temperature: temperature.default(0.2),
  maxTokensPerRun: maxTokensPerRun.default(4000),
  monthlyBudgetUsd: monthlyBudgetUsd.optional(),
});

export const updateAgentSchema = z.object({
  name: name.optional(),
  externalId: externalId.optional(),
  description: description.optional(),
  instructions: instructions.optional(),
  provider: provider.optional(),
  model: model.optional(),
  role: role.optional(),
  temperature: temperature.optional(),
  maxTokensPerRun: maxTokensPerRun.optional(),
  monthlyBudgetUsd: monthlyBudgetUsd.optional(),
}).strict().refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided",
});

export const agentListQuerySchema = z.object({
  status: z.enum(agentStatus.enumValues).optional(),
  role: z.enum(agentRole.enumValues).optional(),
});

export type CreateAgentInput = z.infer<typeof createAgentSchema>;
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;
