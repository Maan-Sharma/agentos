import crypto from "node:crypto";

import { eq } from "drizzle-orm";

import { db } from "../../db/index.js";
import { agentApiKeys } from "../../db/schema.js";

export async function authenticateAgentApiKey(apiKey: string) {
    const keyHash = crypto
        .createHash("sha256")
        .update(apiKey)
        .digest("hex");

    const [key] = await db
        .select()
        .from(agentApiKeys)
        .where(eq(agentApiKeys.keyHash, keyHash))
        .limit(1);

    if (!key) {
        return null;
    }

    if (key.revokedAt) {
        return null;
    }

    await db
        .update(agentApiKeys)
        .set({
            lastUsedAt: new Date(),
        })
        .where(eq(agentApiKeys.id, key.id));

    return key;
}