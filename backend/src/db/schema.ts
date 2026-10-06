import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const agentStatus = pgEnum("agent_status", [
  "active",
  "inactive",
  "paused",
]);

export const agents = pgTable("agents", {
  id: uuid("id").defaultRandom().primaryKey(),

  name: varchar("name", {
    length: 120,
  }).notNull(),

  description: text("description"),

  instructions: text("instructions").notNull(),

  model: varchar("model", {
    length: 100,
  })
    .notNull()
    .default("gpt-5.6"),

  status: agentStatus().notNull().default("inactive"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),
});