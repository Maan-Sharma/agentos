"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAgent = createAgent;
exports.getAgents = getAgents;
const index_js_1 = require("../../db/index.js");
const schema_js_1 = require("../../db/schema.js");
async function createAgent(input) {
    const [agent] = await index_js_1.db
        .insert(schema_js_1.agents)
        .values({
        name: input.name,
        description: input.description ?? null,
        instructions: input.instructions,
        model: input.model,
        status: input.status,
    })
        .returning();
    return agent;
}
async function getAgents() {
    return index_js_1.db.select().from(schema_js_1.agents);
}
