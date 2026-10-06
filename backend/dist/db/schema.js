"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agents = exports.agentStatus = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.agentStatus = (0, pg_core_1.pgEnum)("agent_status", [
    "active",
    "inactive",
    "paused",
]);
exports.agents = (0, pg_core_1.pgTable)("agents", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    name: (0, pg_core_1.varchar)("name", {
        length: 120,
    }).notNull(),
    description: (0, pg_core_1.text)("description"),
    instructions: (0, pg_core_1.text)("instructions").notNull(),
    model: (0, pg_core_1.varchar)("model", {
        length: 100,
    })
        .notNull()
        .default("gpt-5.6"),
    status: (0, exports.agentStatus)().notNull().default("inactive"),
    createdAt: (0, pg_core_1.timestamp)("created_at")
        .defaultNow()
        .notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at")
        .defaultNow()
        .notNull(),
});
