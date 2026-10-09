import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import argon2 from "argon2";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { config } from "../../config.js";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { requireAuth } from "./auth.hooks.js";
import {
  createSession,
  createUserWithWorkspace,
  createWorkspaceForUser,
  deleteSession,
  findUserByEmail,
  verifyPassword,
} from "./auth.service.js";
import {
  googleCallbackSchema,
  loginSchema,
  signupSchema,
} from "./auth.schema.js";

const SESSION_COOKIE = "agentos_session";
const OAUTH_STATE_COOKIE = "agentos_google_state";
const OAUTH_VERIFIER_COOKIE = "agentos_google_verifier";
const AUTH_COOKIE_PATH = "/";
const OAUTH_COOKIE_PATH = "/api/v1/auth/google";

const googleTokenSchema = z.object({
  access_token: z.string().min(1),
});

const googleProfileSchema = z.object({
  sub: z.string().min(1),
  email: z.string().email().transform((email) => email.toLowerCase()),
  email_verified: z.boolean().optional(),
  verified_email: z.boolean().optional(),
  name: z.string().trim().min(1).max(120).optional(),
});

function cookieOptions() {
  return {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: AUTH_COOKIE_PATH,
  };
}

function setSessionCookie(
  reply: FastifyReply,
  token: string,
  expiresAt: Date,
) {
  reply.setCookie(SESSION_COOKIE, token, {
    ...cookieOptions(),
    expires: expiresAt,
  });
}

function requestMetadata(request: FastifyRequest) {
  return {
    userAgent: request.headers["user-agent"],
    ip: request.ip,
  };
}

function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error &&
    (error as { code?: unknown }).code === "23505";
}

function googleIsConfigured() {
  return Boolean(
    config.GOOGLE_CLIENT_ID &&
    config.GOOGLE_CLIENT_SECRET &&
    config.GOOGLE_REDIRECT_URI,
  );
}

async function createLoginSession(
  request: FastifyRequest,
  reply: FastifyReply,
  userId: string,
) {
  const session = await createSession(userId, requestMetadata(request));
  setSessionCookie(reply, session.token, session.expiresAt);
}

function authRateLimits(app: FastifyInstance) {
  const timeWindow = 15 * 60 * 1000;
  const byIp = app.rateLimit({
    max: 10,
    timeWindow,
    groupId: "auth-ip",
    keyGenerator: (request) => request.ip,
  });
  const byEmail = app.rateLimit({
    max: 10,
    timeWindow,
    groupId: "auth-email",
    keyGenerator: (request) => {
      const parsed = loginSchema
        .pick({ email: true })
        .safeParse(request.body);
      return parsed.success ? parsed.data.email : `${request.ip}:invalid-email`;
    },
  });
  return [byIp, byEmail];
}

export async function authRoutes(app: FastifyInstance) {
  const credentialRateLimits = authRateLimits(app);

  app.post("/api/v1/auth/signup", {
    preHandler: credentialRateLimits,
  }, async (request, reply) => {
    const result = signupSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        error: "Invalid signup data",
        details: result.error.flatten(),
      });
    }

    const existingUser = await findUserByEmail(result.data.email);
    if (existingUser) {
      return reply.status(409).send({ error: "An account with this email already exists" });
    }

    const passwordHash = await argon2.hash(result.data.password, {
      type: argon2.argon2id,
    });

    try {
      const { user } = await createUserWithWorkspace(result.data, passwordHash);
      await createLoginSession(request, reply, user.id);
      return reply.status(201).send({ user });
    } catch (error) {
      if (isUniqueViolation(error)) {
        return reply.status(409).send({ error: "An account with this email already exists" });
      }
      throw error;
    }
  });

  app.post("/api/v1/auth/login", {
    preHandler: credentialRateLimits,
  }, async (request, reply) => {
    const result = loginSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        error: "Invalid login data",
        details: result.error.flatten(),
      });
    }

    const user = await findUserByEmail(result.data.email);
    const passwordMatches = user?.passwordHash
      ? await verifyPassword(result.data.password, user.passwordHash)
      : false;

    if (!user || !passwordMatches) {
      return reply.status(401).send({ error: "Invalid email or password" });
    }

    await createLoginSession(request, reply, user.id);
    return reply.status(200).send({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerifiedAt: user.emailVerifiedAt,
        createdAt: user.createdAt,
      },
    });
  });

  app.post("/api/v1/auth/logout", async (request, reply) => {
    const token = request.cookies[SESSION_COOKIE];
    if (token) await deleteSession(token);
    reply.clearCookie(SESSION_COOKIE, cookieOptions());
    return reply.status(204).send();
  });

  app.get("/api/v1/auth/me", { preHandler: requireAuth }, async (request, reply) => {
    const authContext = request.authContext;
    if (!authContext) {
      return reply.status(401).send({ error: "Authentication required" });
    }

    return {
      user: authContext.user,
      workspace: authContext.workspace,
      role: authContext.role,
    };
  });

  app.get("/api/v1/auth/google", async (_request, reply) => {
    if (!googleIsConfigured()) {
      return reply.status(503).send({ error: "Google sign-in is not configured" });
    }

    const state = randomBytes(32).toString("hex");
    const verifier = randomBytes(32).toString("base64url");
    const challenge = createHash("sha256").update(verifier).digest("base64url");
    const authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authorizationUrl.search = new URLSearchParams({
      client_id: config.GOOGLE_CLIENT_ID!,
      redirect_uri: config.GOOGLE_REDIRECT_URI!,
      response_type: "code",
      scope: "openid email profile",
      state,
      code_challenge: challenge,
      code_challenge_method: "S256",
    }).toString();

    const oauthCookieOptions = {
      ...cookieOptions(),
      path: OAUTH_COOKIE_PATH,
      maxAge: 600,
    };
    reply.setCookie(OAUTH_STATE_COOKIE, state, oauthCookieOptions);
    reply.setCookie(OAUTH_VERIFIER_COOKIE, verifier, oauthCookieOptions);
    return reply.redirect(authorizationUrl.toString());
  });

  app.get("/api/v1/auth/google/callback", async (request, reply) => {
    if (!googleIsConfigured()) {
      return reply.status(503).send({ error: "Google sign-in is not configured" });
    }

    const result = googleCallbackSchema.safeParse(request.query);
    const storedState = request.cookies[OAUTH_STATE_COOKIE];
    const verifier = request.cookies[OAUTH_VERIFIER_COOKIE];
    const stateMatches = storedState && result.success &&
      storedState.length === result.data.state.length &&
      timingSafeEqual(Buffer.from(storedState), Buffer.from(result.data.state));
    const oauthCookieOptions = {
      ...cookieOptions(),
      path: OAUTH_COOKIE_PATH,
    };
    reply.clearCookie(OAUTH_STATE_COOKIE, oauthCookieOptions);
    reply.clearCookie(OAUTH_VERIFIER_COOKIE, oauthCookieOptions);

    if (!result.success || !stateMatches || !verifier) {
      return reply.status(400).send({ error: "Invalid Google OAuth state or callback" });
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: result.data.code,
        client_id: config.GOOGLE_CLIENT_ID!,
        client_secret: config.GOOGLE_CLIENT_SECRET!,
        redirect_uri: config.GOOGLE_REDIRECT_URI!,
        grant_type: "authorization_code",
        code_verifier: verifier,
      }),
    });
    if (!tokenResponse.ok) {
      request.log.warn({ statusCode: tokenResponse.status }, "Google token exchange failed");
      return reply.status(401).send({ error: "Google sign-in failed" });
    }

    const tokenResult = googleTokenSchema.safeParse(await tokenResponse.json());
    if (!tokenResult.success) {
      return reply.status(401).send({ error: "Google sign-in failed" });
    }

    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokenResult.data.access_token}` },
    });
    if (!profileResponse.ok) {
      return reply.status(401).send({ error: "Google sign-in failed" });
    }

    const profileResult = googleProfileSchema.safeParse(await profileResponse.json());
    const profile = profileResult.success ? profileResult.data : null;
    if (!profile || !(profile.email_verified ?? profile.verified_email)) {
      return reply.status(401).send({ error: "Google account email must be verified" });
    }

    let user = await db.select().from(users).where(eq(users.googleId, profile.sub)).limit(1)
      .then(([record]) => record);
    if (!user) {
      user = await findUserByEmail(profile.email) ?? undefined;
      if (user?.googleId && user.googleId !== profile.sub) {
        return reply.status(409).send({ error: "This email is linked to another Google account" });
      }

      if (user) {
        await db.update(users).set({
          googleId: profile.sub,
          emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
        }).where(eq(users.id, user.id));
      } else {
        const input = {
          name: profile.name ?? profile.email.split("@")[0]!,
          email: profile.email,
        };
        const created = await db.transaction(async (tx) => {
          const [newUser] = await tx.insert(users).values({
            ...input,
            googleId: profile.sub,
            emailVerifiedAt: new Date(),
          }).returning({
            id: users.id,
            name: users.name,
            email: users.email,
            emailVerifiedAt: users.emailVerifiedAt,
            createdAt: users.createdAt,
          });
          const workspace = await createWorkspaceForUser(tx, newUser.id, newUser.name);
          return { user: newUser, workspace };
        });
        user = {
          ...created.user,
          passwordHash: null,
          googleId: profile.sub,
        };
      }
    }

    await createLoginSession(request, reply, user.id);
    return reply.redirect(`${config.CORS_ORIGIN}/?auth=google`);
  });
}
