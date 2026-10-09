import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";

import { db } from "../../db/index.js";
import { agentExecutions, agents } from "../../db/schema.js";
import { authenticateAgentApiKey } from "../agents/agent-auth.service.js";

const executionTelemetrySchema = z
  .object({
    externalExecutionId: z
      .string()
      .trim()
      .min(1, "externalExecutionId must not be empty")
      .max(120, "externalExecutionId is too long")
      .optional()
      .nullable()
      .transform((value) => value ?? undefined),
    input: z
      .string()
      .trim()
      .min(1, "Input is required")
      .max(20000, "Input is too long"),
    output: z
      .string()
      .trim()
      .max(50000, "Output is too long")
      .optional()
      .nullable()
      .transform((value) => value ?? undefined),
    status: z
      .enum(["queued", "running", "completed", "failed", "cancelled", "error"])
      .default("completed"),
    model: z
      .string()
      .trim()
      .min(1, "Model is required")
      .max(100, "Model is too long"),
    inputTokens: z.number().int().nonnegative().max(10000000).optional(),
    outputTokens: z.number().int().nonnegative().max(10000000).optional(),
    totalTokens: z.number().int().nonnegative().max(20000000).optional(),
    latencyMs: z.number().int().nonnegative().max(600000).optional(),
    cost: z
      .union([
        z.string().trim().min(1),
        z.number().finite(),
      ])
      .optional()
      .nullable()
      .transform((value) => {
        if (value === undefined || value === null) {
          return undefined;
        }

        if (typeof value === "number") {
          return Number.isFinite(value) ? value.toFixed(6) : undefined;
        }

        return value;
      }),
    error: z.string().trim().max(5000).optional().nullable().transform((value) => value ?? undefined),
    startedAt: z.coerce.date().optional(),
    completedAt: z.coerce.date().optional().nullable(),
  })
  .refine((data) => {
    const startedAt = data.startedAt ?? new Date();
    if (!data.completedAt) {
      return true;
    }

    return new Date(data.completedAt).getTime() >= new Date(startedAt).getTime();
  }, {
    message: "completedAt must be on or after startedAt",
    path: ["completedAt"],
  });

export async function executionRoutes(app: FastifyInstance) {
  app.post("/api/ingest/executions", async (request, reply) => {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.status(401).send({
        error: "Missing or invalid Authorization header",
      });
    }

    const apiKey = authHeader.slice("Bearer ".length).trim();

    if (!apiKey) {
      return reply.status(401).send({
        error: "Missing API key",
      });
    }

    const key = await authenticateAgentApiKey(apiKey);

    if (!key) {
      return reply.status(401).send({
        error: "Invalid or revoked API key",
      });
    }

    const result = executionTelemetrySchema.safeParse(request.body);

    if (!result.success) {
      return reply.status(400).send({
        error: "Invalid execution telemetry payload",
        details: result.error.flatten(),
      });
    }

    const payload = result.data;
    const startedAt = payload.startedAt ?? new Date();
    const completedAt = payload.completedAt ?? startedAt;

    const execution = await db.transaction(async (tx) => {
      const [createdExecution] = await tx
        .insert(agentExecutions)
        .values({
          agentId: key.agentId,
          externalExecutionId: payload.externalExecutionId ?? null,
          input: payload.input,
          output: payload.output ?? null,
          status: payload.status,
          model: payload.model,
          inputTokens: payload.inputTokens ?? null,
          outputTokens: payload.outputTokens ?? null,
          totalTokens: payload.totalTokens ?? null,
          latencyMs: payload.latencyMs ?? null,
          cost: payload.cost ?? null,
          error: payload.error ?? null,
          startedAt,
          completedAt,
        })
        .returning();

      await tx
        .update(agents)
        .set({ lastActiveAt: sql`greatest(${agents.lastActiveAt}, ${startedAt})` })
        .where(eq(agents.id, key.agentId));

      return createdExecution;
    });

    return reply.status(201).send({
      execution,
    });
  });
}
