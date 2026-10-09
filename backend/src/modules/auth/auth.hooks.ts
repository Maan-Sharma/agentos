import type { FastifyReply, FastifyRequest } from "fastify";

import { findAuthContext, type AuthContext } from "./auth.service.js";

declare module "fastify" {
  interface FastifyRequest {
    authContext: AuthContext | null;
  }
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const token = request.cookies.agentos_session;
  if (!token) {
    return reply.status(401).send({ error: "Authentication required" });
  }

  const authContext = await findAuthContext(token);
  if (!authContext) {
    return reply.status(401).send({ error: "Authentication required" });
  }

  request.authContext = authContext;
}

export function requireRole(role: "admin") {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const roleRank = { member: 0, admin: 1, owner: 2 } as const;
    const actualRole = request.authContext?.role;
    if (!actualRole || roleRank[actualRole] < roleRank[role]) {
      return reply.status(403).send({ error: "Insufficient workspace role" });
    }
  };
}
