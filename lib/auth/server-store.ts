import crypto from "node:crypto";
import type { AuthUser, AuthSession } from "./types";

interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  salt?: string;
  role: string;
  avatarInitials: string;
  provider: "email" | "google";
  createdAt: string;
}

interface StoredSession {
  token: string;
  userId: string;
  expiresAt: number;
}

interface AuthStore {
  users: Map<string, StoredUser>;
  sessions: Map<string, StoredSession>;
}

declare global {
  var __agentos_auth_store: AuthStore | undefined;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return { hash, salt };
}

function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(verifyHash, "hex"));
  } catch {
    return false;
  }
}

function initializeStore(): AuthStore {
  if (globalThis.__agentos_auth_store) {
    return globalThis.__agentos_auth_store;
  }

  const store: AuthStore = {
    users: new Map(),
    sessions: new Map(),
  };

  // Pre-seed default demo account (matches existing workspace owner in app shell)
  const defaultSalt = "c4a91b2e67df10aa83cb20a4b8df0912";
  const defaultHash = crypto.pbkdf2Sync("password123", defaultSalt, 10000, 64, "sha512").toString("hex");
  
  const defaultUser: StoredUser = {
    id: "usr_default_owner",
    name: "Man Mohan",
    email: "man@acmeco.com",
    passwordHash: defaultHash,
    salt: defaultSalt,
    role: "Workspace owner",
    avatarInitials: "MM",
    provider: "email",
    createdAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
  };

  store.users.set(defaultUser.email.toLowerCase(), defaultUser);

  globalThis.__agentos_auth_store = store;
  return store;
}

const store = initializeStore();

function toPublicUser(user: StoredUser): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarInitials: user.avatarInitials,
    provider: user.provider,
    createdAt: user.createdAt,
  };
}

export function getUserByEmail(email: string): StoredUser | undefined {
  return store.users.get(email.trim().toLowerCase());
}

export function getUserById(id: string): StoredUser | undefined {
  for (const user of store.users.values()) {
    if (user.id === id) return user;
  }
  return undefined;
}

export function createUser(params: {
  name: string;
  email: string;
  password?: string;
  provider: "email" | "google";
  role?: string;
}): AuthUser {
  const emailKey = params.email.trim().toLowerCase();
  if (store.users.has(emailKey)) {
    throw new Error("An account with this email already exists.");
  }

  let passwordHash: string | undefined;
  let salt: string | undefined;

  if (params.password) {
    const hashed = hashPassword(params.password);
    passwordHash = hashed.hash;
    salt = hashed.salt;
  }

  const newUser: StoredUser = {
    id: `usr_${crypto.randomUUID()}`,
    name: params.name.trim(),
    email: params.email.trim().toLowerCase(),
    passwordHash,
    salt,
    role: params.role || "Member",
    avatarInitials: getInitials(params.name),
    provider: params.provider,
    createdAt: new Date().toISOString(),
  };

  store.users.set(emailKey, newUser);
  return toPublicUser(newUser);
}

export function verifyUserCredentials(email: string, password: string): AuthUser | null {
  const user = getUserByEmail(email);
  if (!user || !user.passwordHash || !user.salt) {
    return null;
  }

  const isValid = verifyPassword(password, user.passwordHash, user.salt);
  if (!isValid) return null;

  return toPublicUser(user);
}

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function createSession(userId: string): AuthSession {
  const user = getUserById(userId);
  if (!user) {
    throw new Error("User not found.");
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + SESSION_TTL_MS;

  const session: StoredSession = {
    token,
    userId,
    expiresAt,
  };

  store.sessions.set(token, session);

  return {
    user: toPublicUser(user),
    token,
    expiresAt,
  };
}

export function getSession(token: string): AuthSession | null {
  if (!token) return null;
  const session = store.sessions.get(token);
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    store.sessions.delete(token);
    return null;
  }

  const user = getUserById(session.userId);
  if (!user) {
    store.sessions.delete(token);
    return null;
  }

  return {
    user: toPublicUser(user),
    token: session.token,
    expiresAt: session.expiresAt,
  };
}

export function deleteSession(token: string): void {
  store.sessions.delete(token);
}

export function parseGoogleJwt(credential: string): { email: string; name: string; sub: string } | null {
  try {
    const parts = credential.split(".");
    if (parts.length < 2) return null;
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    if (!payload.email) return null;
    return {
      email: payload.email,
      name: payload.name || payload.email.split("@")[0],
      sub: payload.sub || "",
    };
  } catch {
    return null;
  }
}
