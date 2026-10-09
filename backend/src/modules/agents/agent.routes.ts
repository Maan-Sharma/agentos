import { and, eq } from "drizzle-orm";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { db } from "../../db/index.js";
import { agentApiKeys, agents } from "../../db/schema.js";
import { requireAuth, requireRole } from "../auth/auth.hooks.js";
import { createAgentApiKey } from "./agent-key.service.js";
import {
  agentListQuerySchema,
  createAgentSchema,
  updateAgentSchema,
} from "./agent.schema.js";
import {
  createAgent,
  deleteAgent,
  getAgent,
  getAgents,
  setAgentPaused,
  updateAgent,
} from "./agent.service.js";

const createAgentKeySchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
});

const agentParamsSchema = z.object({ id: z.string().uuid() });
const keyParamsSchema = z.object({
  id: z.string().uuid(),
  keyId: z.string().uuid(),
});

function authContext(request: FastifyRequest, reply: FastifyReply) {
  const context = request.authContext;
  if (!context) {
    reply.status(401).send({ error: "Authentication required" });
    return null;
  }
  return context;
}

async function createAgentHandler(request: FastifyRequest, reply: FastifyReply) {
  const context = authContext(request, reply);
  if (!context) return;

  const result = createAgentSchema.safeParse(request.body);
  if (!result.success) {
    return reply.status(400).send({
      error: "Invalid agent data",
      details: result.error.flatten(),
    });
  }

  const agent = await createAgent(result.data, context.workspaceId, context.userId);
  return reply.status(201).send({ agent });
}

async function getAgentsHandler(request: FastifyRequest, reply: FastifyReply) {
  const context = authContext(request, reply);
  if (!context) return;

  const query = agentListQuerySchema.safeParse(request.query);
  if (!query.success) {
    return reply.status(400).send({
      error: "Invalid agent filters",
      details: query.error.flatten(),
    });
  }

  return { agents: await getAgents(context.workspaceId, query.data) };
}

async function getAgentHandler(request: FastifyRequest, reply: FastifyReply) {
  const context = authContext(request, reply);
  if (!context) return;
  const params = agentParamsSchema.safeParse(request.params);
  if (!params.success) return reply.status(400).send({ error: "Invalid agent ID" });

  const agent = await getAgent(params.data.id, context.workspaceId);
  if (!agent) return reply.status(404).send({ error: "Agent not found" });
  return { agent };
}

async function updateAgentHandler(request: FastifyRequest, reply: FastifyReply) {
  const context = authContext(request, reply);
  if (!context) return;
  const params = agentParamsSchema.safeParse(request.params);
  if (!params.success) return reply.status(400).send({ error: "Invalid agent ID" });

  const body = updateAgentSchema.safeParse(request.body);
  if (!body.success) {
    return reply.status(400).send({
      error: "Invalid agent data",
      details: body.error.flatten(),
    });
  }

  const agent = await updateAgent(
    params.data.id,
    context.workspaceId,
    context.userId,
    body.data,
  );
  if (!agent) return reply.status(404).send({ error: "Agent not found" });
  return { agent };
}

async function deleteAgentHandler(request: FastifyRequest, reply: FastifyReply) {
  const context = authContext(request, reply);
  if (!context) return;
  const params = agentParamsSchema.safeParse(request.params);
  if (!params.success) return reply.status(400).send({ error: "Invalid agent ID" });

  const deleted = await deleteAgent(params.data.id, context.workspaceId, context.userId);
  if (!deleted) return reply.status(404).send({ error: "Agent not found" });
  return reply.status(204).send();
}

function setPausedHandler(paused: boolean) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const context = authContext(request, reply);
    if (!context) return;
    const params = agentParamsSchema.safeParse(request.params);
    if (!params.success) return reply.status(400).send({ error: "Invalid agent ID" });

    const agent = await setAgentPaused(
      params.data.id,
      context.workspaceId,
      context.userId,
      paused,
    );
    if (!agent) return reply.status(404).send({ error: "Agent not found" });
    return { agent };
  };
}

async function createAgentKeyHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const context = authContext(request, reply);
  if (!context) return;

  const params = agentParamsSchema.safeParse(request.params);
  if (!params.success) {
    return reply.status(400).send({ error: "Invalid agent ID" });
  }

  const body = createAgentKeySchema.safeParse(request.body ?? {});
  if (!body.success) {
    return reply.status(400).send({
      error: "Invalid key payload",
      details: body.error.flatten(),
    });
  }

  const [agent] = await db
    .select({ id: agents.id })
    .from(agents)
    .where(and(eq(agents.id, params.data.id), eq(agents.workspaceId, context.workspaceId)))
    .limit(1);

  if (!agent) return reply.status(404).send({ error: "Agent not found" });

  const result = await createAgentApiKey(
    agent.id,
    body.data.name ?? "Default API Key",
  );
  return reply.status(201).send(result);
}

async function revokeAgentKeyHandler(
  request: FastifyRequest<{ Params: { id: string; keyId: string } }>,
  reply: FastifyReply,
) {
  const context = authContext(request, reply);
  if (!context) return;

  const params = keyParamsSchema.safeParse(request.params);
  if (!params.success) {
    return reply.status(400).send({ error: "Invalid agent or API key ID" });
  }

  const [key] = await db
    .select({ id: agentApiKeys.id })
    .from(agentApiKeys)
    .innerJoin(agents, eq(agentApiKeys.agentId, agents.id))
    .where(and(
      eq(agentApiKeys.id, params.data.keyId),
      eq(agents.id, params.data.id),
      eq(agents.workspaceId, context.workspaceId),
    ))
    .limit(1);

  if (!key) return reply.status(404).send({ error: "API key not found" });

  await db
    .update(agentApiKeys)
    .set({ revokedAt: new Date() })
    .where(eq(agentApiKeys.id, key.id));

  return reply.status(200).send({
    success: true,
    keyId: key.id,
    revoked: true,
  });
}

export async function agentRoutes(app: FastifyInstance) {
  const protectedRoute = { preHandler: requireAuth };

  for (const path of ["/api/v1/agents", "/api/agents"]) {
    app.post(path, protectedRoute, createAgentHandler);
    app.get(path, protectedRoute, getAgentsHandler);
    app.get(`${path}/:id`, protectedRoute, getAgentHandler);
    app.patch(`${path}/:id`, protectedRoute, updateAgentHandler);
    app.delete(
      `${path}/:id`,
      { preHandler: [requireAuth, requireRole("admin")] },
      deleteAgentHandler,
    );
    app.post(`${path}/:id/pause`, protectedRoute, setPausedHandler(true));
    app.post(`${path}/:id/resume`, protectedRoute, setPausedHandler(false));
  }

  for (const path of ["/api/v1/agents/:id/keys", "/api/agents/:id/keys"]) {
    app.post<{ Params: { id: string } }>(path, protectedRoute, createAgentKeyHandler);
  }

  for (const path of [
    "/api/v1/agents/:id/keys/:keyId/revoke",
    "/api/agents/:id/keys/:keyId/revoke",
  ]) {
    app.post<{ Params: { id: string; keyId: string } }>(
      path,
      protectedRoute,
      revokeAgentKeyHandler,
    );
  }
}
