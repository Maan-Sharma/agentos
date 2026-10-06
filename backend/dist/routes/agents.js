"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentsRouter = void 0;
const express_1 = require("express");
exports.agentsRouter = (0, express_1.Router)();
exports.agentsRouter.get("/", (_request, response) => {
    response.status(501).json({
        error: {
            code: "NOT_IMPLEMENTED",
            message: "Connect the agents route to your database before using this endpoint.",
        },
    });
});
