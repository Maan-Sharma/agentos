"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
require("dotenv/config");
const cors_1 = __importDefault(require("@fastify/cors"));
const fastify_1 = __importDefault(require("fastify"));
const agent_routes_js_1 = require("./modules/agents/agent.routes.js");
async function createApp() {
    const app = (0, fastify_1.default)({
        logger: true,
    });
    await app.register(cors_1.default, {
        origin: true,
    });
    app.get("/api/v1/health", async () => ({
        status: "ok",
        service: "agentos-api",
    }));
    await app.register(agent_routes_js_1.agentRoutes);
    return app;
}
