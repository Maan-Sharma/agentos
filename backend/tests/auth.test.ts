import { randomUUID } from "node:crypto";
import type { OutgoingHttpHeaders } from "node:http";
import { and, eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createApp } from "../src/app.js";
import { db, pool } from "../src/db/index.js";
import { createAgentApiKey } from "../src/modules/agents/agent-key.service.js";
import { auditLogs, users, workspaceMembers, workspaces } from "../src/db/schema.js";

const app = await createApp();
const createdEmails: string[] = [];
const testPassword = "correct-horse-battery-staple";

function cookieFrom(response: { headers: OutgoingHttpHeaders }) {
  const setCookie = response.headers["set-cookie"];
  const header = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  if (typeof header !== "string") throw new Error("Expected the response to set a session cookie");
  return header.split(";")[0]!;
}

async function signup(name: string) {
  const email = `test-${randomUUID()}@example.test`;
  createdEmails.push(email);
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/auth/signup",
    payload: { name, email, password: testPassword },
  });
  return { response, email };
}

describe("authentication and workspace isolation", () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    if (createdEmails.length) {
      const workspaceRows = await db
        .select({ workspaceId: workspaceMembers.workspaceId })
        .from(workspaceMembers)
        .innerJoin(users, eq(workspaceMembers.userId, users.id))
        .where(inArray(users.email, createdEmails));
      const workspaceIds = [...new Set(workspaceRows.map(({ workspaceId }) => workspaceId))];
      if (workspaceIds.length) {
        await db.delete(workspaces).where(inArray(workspaces.id, workspaceIds));
      }
      await db.delete(users).where(inArray(users.email, createdEmails));
    }
    await app.close();
    await pool.end();
  });

  it("signs up a user, creates their personal workspace, and makes them its owner", async () => {
    const { response } = await signup("Signup Test");
    expect(response.statusCode).toBe(201);
    expect(response.json().user).not.toHaveProperty("passwordHash");

    const cookie = cookieFrom(response);
    const sessionCookie = String(response.headers["set-cookie"]);
    expect(sessionCookie).toContain("HttpOnly");
    expect(sessionCookie).toContain("SameSite=Lax");

    const me = await app.inject({
      method: "GET",
      url: "/api/v1/auth/me",
      headers: { cookie },
    });
    expect(me.statusCode).toBe(200);
    expect(me.json().workspace.name).toBe("Signup Test");
    expect(me.json().role).toBe("owner");
  });

  it("logs in and uses the same error for an unknown email or wrong password", async () => {
    const { email } = await signup("Login Test");

    const login = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email, password: testPassword },
    });
    expect(login.statusCode).toBe(200);
    expect(String(login.headers["set-cookie"])).toContain("HttpOnly");

    const unknownEmail = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: `unknown-${randomUUID()}@example.test`, password: testPassword },
    });
    const wrongPassword = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email, password: "wrong-password" },
    });
    expect(unknownEmail.statusCode).toBe(401);
    expect(wrongPassword.statusCode).toBe(401);
    expect(unknownEmail.json().error).toBe(wrongPassword.json().error);
  }, 20_000);

  it("logs out and invalidates the session cookie", async () => {
    const { response } = await signup("Logout Test");
    const cookie = cookieFrom(response);

    const logout = await app.inject({
      method: "POST",
      url: "/api/v1/auth/logout",
      headers: { cookie },
    });
    expect(logout.statusCode).toBe(204);

    const me = await app.inject({
      method: "GET",
      url: "/api/v1/auth/me",
      headers: { cookie },
    });
    expect(me.statusCode).toBe(401);
  });

  it("requires authentication for /me", async () => {
    const response = await app.inject({ method: "GET", url: "/api/v1/auth/me" });
    expect(response.statusCode).toBe(401);
  });

  it("does not expose user A's agents to user B", async () => {
    const userA = await signup("Workspace A");
    const userB = await signup("Workspace B");
    const cookieA = cookieFrom(userA.response);
    const cookieB = cookieFrom(userB.response);

    const created = await app.inject({
      method: "POST",
      url: "/api/v1/agents",
      headers: { cookie: cookieA },
      payload: { name: "Private agent A" },
    });
    expect(created.statusCode).toBe(201);

    const readAsA = await app.inject({
      method: "GET",
      url: "/api/v1/agents",
      headers: { cookie: cookieA },
    });
    const readAsB = await app.inject({
      method: "GET",
      url: "/api/v1/agents",
      headers: { cookie: cookieB },
    });
    expect(readAsA.json().agents).toHaveLength(1);
    expect(readAsB.statusCode).toBe(200);
    expect(readAsB.json().agents).toHaveLength(0);
  });

  it("manages agents, derives activity status, scopes mutations, and records audit events", async () => {
    const owner = await signup("Agent Owner");
    const other = await signup("Other Workspace");
    const ownerCookie = cookieFrom(owner.response);
    const otherCookie = cookieFrom(other.response);
    const me = await app.inject({
      method: "GET",
      url: "/api/v1/auth/me",
      headers: { cookie: ownerCookie },
    });

    const created = await app.inject({
      method: "POST",
      url: "/api/v1/agents",
      headers: { cookie: ownerCookie },
      payload: {
        name: "Managed Agent",
        provider: "anthropic",
        model: "claude-test",
        role: "support",
        monthlyBudgetUsd: 50,
      },
    });
    expect(created.statusCode).toBe(201);
    const agentId = created.json().agent.id as string;
    expect(created.json().agent.status).toBe("inactive");

    const crossWorkspaceRead = await app.inject({
      method: "GET",
      url: `/api/v1/agents/${agentId}`,
      headers: { cookie: otherCookie },
    });
    const crossWorkspaceUpdate = await app.inject({
      method: "PATCH",
      url: `/api/v1/agents/${agentId}`,
      headers: { cookie: otherCookie },
      payload: { name: "Stolen Agent" },
    });
    expect(crossWorkspaceRead.statusCode).toBe(404);
    expect(crossWorkspaceUpdate.statusCode).toBe(404);

    const apiKey = await createAgentApiKey(agentId, "Activity test key");
    const execution = await app.inject({
      method: "POST",
      url: "/api/ingest/executions",
      headers: { authorization: `Bearer ${apiKey.apiKey}` },
      payload: {
        input: "Check recent activity",
        model: "claude-test",
        status: "completed",
      },
    });
    expect(execution.statusCode).toBe(201);
    const afterExecution = await app.inject({
      method: "GET",
      url: `/api/v1/agents/${agentId}`,
      headers: { cookie: ownerCookie },
    });
    expect(afterExecution.json().agent.lastActiveAt).not.toBeNull();
    expect(afterExecution.json().agent.status).toBe("active");
    const activeList = await app.inject({
      method: "GET",
      url: "/api/v1/agents?status=active&role=support",
      headers: { cookie: ownerCookie },
    });
    expect(activeList.json().agents.map((agent: { id: string }) => agent.id)).toContain(agentId);

    const updated = await app.inject({
      method: "PATCH",
      url: `/api/v1/agents/${agentId}`,
      headers: { cookie: ownerCookie },
      payload: { description: "Updated description", monthlyBudgetUsd: 75 },
    });
    expect(updated.statusCode).toBe(200);
    expect(updated.json().agent.description).toBe("Updated description");
    expect(updated.json().agent.monthlyBudgetUsd).toBe("75.00");

    const paused = await app.inject({
      method: "POST",
      url: `/api/v1/agents/${agentId}/pause`,
      headers: { cookie: ownerCookie },
    });
    expect(paused.json().agent.status).toBe("paused");

    const resumed = await app.inject({
      method: "POST",
      url: `/api/v1/agents/${agentId}/resume`,
      headers: { cookie: ownerCookie },
    });
    expect(resumed.json().agent.status).toBe("active");

    await db
      .update(workspaceMembers)
      .set({ role: "member" })
      .where(and(
        eq(workspaceMembers.workspaceId, me.json().workspace.id),
        eq(workspaceMembers.userId, me.json().user.id),
      ));
    const deniedDelete = await app.inject({
      method: "DELETE",
      url: `/api/v1/agents/${agentId}`,
      headers: { cookie: ownerCookie },
    });
    expect(deniedDelete.statusCode).toBe(403);

    await db
      .update(workspaceMembers)
      .set({ role: "owner" })
      .where(and(
        eq(workspaceMembers.workspaceId, me.json().workspace.id),
        eq(workspaceMembers.userId, me.json().user.id),
      ));
    const deleted = await app.inject({
      method: "DELETE",
      url: `/api/v1/agents/${agentId}`,
      headers: { cookie: ownerCookie },
    });
    expect(deleted.statusCode).toBe(204);

    const events = await db
      .select({ action: auditLogs.action })
      .from(auditLogs)
      .where(and(
        eq(auditLogs.workspaceId, me.json().workspace.id),
        eq(auditLogs.entityId, agentId),
      ));
    expect(events.map((event) => event.action).sort()).toEqual([
      "create",
      "delete",
      "pause",
      "resume",
      "update",
    ]);
  }, 20_000);
});
