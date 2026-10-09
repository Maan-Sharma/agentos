import { and, desc, eq } from "drizzle-orm";

import { db } from "../../db/index.js";
import { agents, auditLogs } from "../../db/schema.js";
import type { CreateAgentInput, UpdateAgentInput } from "./agent.schema.js";

const ACTIVITY_WINDOW_MS = 24 * 60 * 60 * 1000;

function withDerivedStatus<T extends typeof agents.$inferSelect>(agent: T) {
  const activityAge = agent.lastActiveAt
    ? Date.now() - agent.lastActiveAt.getTime()
    : null;
  const active = agent.status !== "paused"
    && activityAge !== null
    && activityAge >= 0
    && activityAge < ACTIVITY_WINDOW_MS;

  return { ...agent, status: agent.status === "paused" ? "paused" as const : active ? "active" as const : "inactive" as const };
}

async function writeAgentAudit(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  input: {
    workspaceId: string;
    userId: string;
    action: string;
    entityId: string;
    metadata?: Record<string, unknown>;
  },
) {
  await tx.insert(auditLogs).values({
    workspaceId: input.workspaceId,
    userId: input.userId,
    action: input.action,
    entity: "agent",
    entityId: input.entityId,
    metadata: input.metadata,
  });
}

export async function createAgent(
  input: CreateAgentInput,
  workspaceId: string,
  userId: string,
) {
  return db.transaction(async (tx) => {
    const [agent] = await tx
      .insert(agents)
      .values({
        workspaceId,
        name: input.name,
        externalId: input.externalId ?? null,
        description: input.description ?? null,
        instructions: input.instructions,
        provider: input.provider,
        model: input.model,
        role: input.role,
        temperature: input.temperature,
        maxTokensPerRun: input.maxTokensPerRun,
        monthlyBudgetUsd: input.monthlyBudgetUsd?.toFixed(2) ?? null,
      })
      .returning();

    await writeAgentAudit(tx, { workspaceId, userId, action: "create", entityId: agent.id });
    return withDerivedStatus(agent);
  });
}

export async function getAgents(
  workspaceId: string,
  filters: {
    status?: "active" | "inactive" | "paused";
    role?: typeof agents.role.enumValues[number];
  } = {},
) {
  const conditions = [eq(agents.workspaceId, workspaceId)];
  if (filters.role) conditions.push(eq(agents.role, filters.role));

  const rows = await db
    .select()
    .from(agents)
    .where(and(...conditions))
    .orderBy(desc(agents.createdAt));

  const results = rows.map(withDerivedStatus);
  return filters.status
    ? results.filter((agent) => agent.status === filters.status)
    : results;
}

export async function getAgent(id: string, workspaceId: string) {
  const [agent] = await db
    .select()
    .from(agents)
    .where(and(eq(agents.id, id), eq(agents.workspaceId, workspaceId)))
    .limit(1);

  return agent ? withDerivedStatus(agent) : null;
}

export async function updateAgent(
  id: string,
  workspaceId: string,
  userId: string,
  input: UpdateAgentInput,
) {
  return db.transaction(async (tx) => {
    const [agent] = await tx
      .update(agents)
      .set({
        ...input,
        monthlyBudgetUsd: input.monthlyBudgetUsd === undefined
          ? undefined
          : input.monthlyBudgetUsd?.toFixed(2) ?? null,
        updatedAt: new Date(),
      })
      .where(and(eq(agents.id, id), eq(agents.workspaceId, workspaceId)))
      .returning();

    if (!agent) return null;

    await writeAgentAudit(tx, {
      workspaceId,
      userId,
      action: "update",
      entityId: agent.id,
      metadata: { fields: Object.keys(input) },
    });
    return withDerivedStatus(agent);
  });
}

export async function setAgentPaused(
  id: string,
  workspaceId: string,
  userId: string,
  paused: boolean,
) {
  return db.transaction(async (tx) => {
    const [agent] = await tx
      .update(agents)
      .set({ status: paused ? "paused" : "inactive", updatedAt: new Date() })
      .where(and(eq(agents.id, id), eq(agents.workspaceId, workspaceId)))
      .returning();

    if (!agent) return null;

    await writeAgentAudit(tx, {
      workspaceId,
      userId,
      action: paused ? "pause" : "resume",
      entityId: agent.id,
    });
    return withDerivedStatus(agent);
  });
}

export async function deleteAgent(id: string, workspaceId: string, userId: string) {
  return db.transaction(async (tx) => {
    const [agent] = await tx
      .select({ id: agents.id })
      .from(agents)
      .where(and(eq(agents.id, id), eq(agents.workspaceId, workspaceId)))
      .limit(1);

    if (!agent) return false;

    await writeAgentAudit(tx, {
      workspaceId,
      userId,
      action: "delete",
      entityId: agent.id,
    });
    await tx.delete(agents).where(and(eq(agents.id, id), eq(agents.workspaceId, workspaceId)));
    return true;
  });
}
