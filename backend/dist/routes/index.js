"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRouter = void 0;
const express_1 = require("express");
const agents_js_1 = require("./agents.js");
exports.apiRouter = (0, express_1.Router)();
exports.apiRouter.get("/health", (_request, response) => {
    response.json({ status: "ok", service: "agentos-api" });
});
exports.apiRouter.use("/agents", agents_js_1.agentsRouter);
