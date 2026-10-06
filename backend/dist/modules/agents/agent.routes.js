"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentRoutes = agentRoutes;
const agent_schema_js_1 = require("./agent.schema.js");
const agent_service_js_1 = require("./agent.service.js");
async function agentRoutes(app) {
    app.post("/api/v1/agents", async (request, reply) => {
        const result = agent_schema_js_1.createAgentSchema.safeParse(request.body);
        if (!result.success) {
            return reply.status(400).send({
                error: "Invalid agent data",
                details: result.error.flatten(),
            });
        }
        const agent = await (0, agent_service_js_1.createAgent)(result.data);
        return reply.status(201).send({
            agent,
        });
    });
    app.get("/api/v1/agents", async () => {
        const agents = await (0, agent_service_js_1.getAgents)();
        return {
            agents,
        };
    });
}
