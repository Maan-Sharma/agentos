import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  integer,
  numeric,
  real,
  jsonb,
  unique,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const agentStatus = pgEnum("agent_status", [
  "active",
  "inactive",
  "paused",
]);

export const workspaceRole = pgEnum("workspace_role", [
  "owner",
  "admin",
  "member",
]);

export const agentProvider = pgEnum("agent_provider", [
  "anthropic",
  "openai",
  "google",
  "other",
]);

export const agentRole = pgEnum("agent_role", [
  "sales",
  "health",
  "support",
  "coding",
  "research",
  "other",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }),
  googleId: varchar("google_id", { length: 255 }).unique(),
  emailVerifiedAt: timestamp("email_verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  check("users_email_lowercase", sql`${table.email} = lower(${table.email})`),
]);

export const workspaces = pgTable("workspaces", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workspaceMembers = pgTable("workspace_members", {
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: workspaceRole().notNull().default("member"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("workspace_members_workspace_user_unique").on(table.workspaceId, table.userId),
]);

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUsedAt: timestamp("last_used_at"),
  userAgent: varchar("user_agent", { length: 500 }),
  ip: varchar("ip", { length: 45 }),
});

export const agents = pgTable("agents", {
  id: uuid("id").defaultRandom().primaryKey(),

  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),

  name: varchar("name", {
    length: 120,
  }).notNull(),

  externalId: varchar("external_id", {
    length: 120,
  }).unique(),

  description: text("description"),

  instructions: text("instructions").notNull(),

  provider: agentProvider().notNull().default("openai"),

  model: varchar("model", {
    length: 100,
  })
    .notNull()
    .default("gpt-5.6"),

  role: agentRole().notNull().default("other"),

  temperature: real("temperature").notNull().default(0.2),

  maxTokensPerRun: integer("max_tokens_per_run").notNull().default(4000),

  monthlyBudgetUsd: numeric("monthly_budget_usd", {
    precision: 12,
    scale: 2,
  }),

  status: agentStatus().notNull().default("inactive"),

  lastActiveAt: timestamp("last_active_at", { withTimezone: true }),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  action: varchar("action", { length: 40 }).notNull(),
  entity: varchar("entity", { length: 80 }).notNull(),
  entityId: uuid("entity_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
});

export const agentExecutions = pgTable("agent_executions", {
  id: uuid("id").defaultRandom().primaryKey(),

  agentId: uuid("agent_id")
    .notNull()
    .references(() => agents.id, {
      onDelete: "cascade",
    }),

  externalExecutionId: varchar("external_execution_id", {
    length: 120,
  }),

  input: text("input").notNull(),

  output: text("output"),

  status: varchar("status", {
    length: 30,
  })
    .notNull()
    .default("running"),

  model: varchar("model", {
    length: 100,
  }).notNull(),

  inputTokens: integer("input_tokens"),

  outputTokens: integer("output_tokens"),

  totalTokens: integer("total_tokens"),

  latencyMs: integer("latency_ms"),

  cost: numeric("cost", {
    precision: 12,
    scale: 6,
  }),


  error: text("error"),

  startedAt: timestamp("started_at")
    .defaultNow()
    .notNull(),

  completedAt: timestamp("completed_at"),


});
export const agentApiKeys = pgTable("agent_api_keys", {
  id: uuid("id").defaultRandom().primaryKey(),

  agentId: uuid("agent_id")
    .notNull()
    .references(() => agents.id, {
      onDelete: "cascade",
    }),

  name: varchar("name", {
    length: 100,
  })
    .notNull()
    .default("Default API Key"),

  keyHash: varchar("key_hash", {
    length: 128,
  }).notNull().unique(),

  lastUsedAt: timestamp("last_used_at"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  revokedAt: timestamp("revoked_at"),
});