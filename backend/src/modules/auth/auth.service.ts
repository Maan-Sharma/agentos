import { createHash, randomBytes } from "node:crypto";
import argon2 from "argon2";
import { and, asc, eq, gt } from "drizzle-orm";

import { db } from "../../db/index.js";
import {
  sessions,
  users,
  workspaceMembers,
  workspaces,
} from "../../db/schema.js";
import type { SignupInput } from "./auth.schema.js";

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type AuthContext = {
  userId: string;
  workspaceId: string;
  role: "owner" | "admin" | "member";
  user: {
    id: string;
    email: string;
    name: string;
    emailVerifiedAt: Date | null;
    createdAt: Date;
  };
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
};

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function createWorkspaceSlug(name: string) {
  const base = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 140) || "personal";
  return `${base}-${randomBytes(8).toString("hex")}`;
}

export async function createWorkspaceForUser(tx: Transaction, userId: string, name: string) {
  const [workspace] = await tx
    .insert(workspaces)
    .values({ name, slug: createWorkspaceSlug(name) })
    .returning();

  await tx.insert(workspaceMembers).values({
    workspaceId: workspace.id,
    userId,
    role: "owner",
  });

  return workspace;
}

export async function createUserWithWorkspace(input: SignupInput, passwordHash: string) {
  return db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({
        name: input.name,
        email: input.email,
        passwordHash,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        emailVerifiedAt: users.emailVerifiedAt,
        createdAt: users.createdAt,
      });

    const workspace = await createWorkspaceForUser(tx, user.id, user.name);
    return { user, workspace };
  });
}

export async function createSession(
  userId: string,
  requestMetadata: { userAgent?: string; ip?: string },
) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await db.insert(sessions).values({
    userId,
    tokenHash: hashSessionToken(token),
    expiresAt,
    lastUsedAt: new Date(),
    userAgent: requestMetadata.userAgent?.slice(0, 500) ?? null,
    ip: requestMetadata.ip?.slice(0, 45) ?? null,
  });

  return { token, expiresAt };
}

export async function findAuthContext(token: string): Promise<AuthContext | null> {
  const tokenHash = hashSessionToken(token);
  const now = new Date();
  const [session] = await db
    .select({
      id: sessions.id,
      userId: users.id,
      email: users.email,
      name: users.name,
      emailVerifiedAt: users.emailVerifiedAt,
      userCreatedAt: users.createdAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, now)))
    .limit(1);

  if (!session) return null;

  const [membership] = await db
    .select({
      workspaceId: workspaces.id,
      workspaceName: workspaces.name,
      workspaceSlug: workspaces.slug,
      role: workspaceMembers.role,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(eq(workspaceMembers.userId, session.userId))
    .orderBy(asc(workspaceMembers.createdAt))
    .limit(1);

  if (!membership) return null;

  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await db
    .update(sessions)
    .set({ lastUsedAt: now, expiresAt })
    .where(eq(sessions.id, session.id));

  return {
    userId: session.userId,
    workspaceId: membership.workspaceId,
    role: membership.role,
    user: {
      id: session.userId,
      email: session.email,
      name: session.name,
      emailVerifiedAt: session.emailVerifiedAt,
      createdAt: session.userCreatedAt,
    },
    workspace: {
      id: membership.workspaceId,
      name: membership.workspaceName,
      slug: membership.workspaceSlug,
    },
  };
}

export async function deleteSession(token: string) {
  await db.delete(sessions).where(eq(sessions.tokenHash, hashSessionToken(token)));
}

export async function findUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return user ?? null;
}

export async function verifyPassword(password: string, passwordHash: string) {
  try {
    return await argon2.verify(passwordHash, password);
  } catch {
    return false;
  }
}
