"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAgentSchema = void 0;
const zod_1 = require("zod");
const schema_js_1 = require("../../db/schema.js");
exports.createAgentSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(2, "Agent name must be at least 2 characters")
        .max(120),
    description: zod_1.z
        .string()
        .max(500)
        .optional(),
    instructions: zod_1.z
        .string()
        .min(1, "Instructions are required"),
    model: zod_1.z
        .string()
        .default("gpt-5.6"),
    status: zod_1.z
        .enum(schema_js_1.agentStatus.enumValues)
        .default("inactive"),
});
