import crypto from "node:crypto";

export function generateApiKey() {
    const randomPart = crypto.randomBytes(32).toString("hex");

    const apiKey = `agos_live_${randomPart}`;

    const keyHash = crypto
        .createHash("sha256")
        .update(apiKey)
        .digest("hex");

    return {
        apiKey,
        keyHash,
    };
}