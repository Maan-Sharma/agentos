import { db } from "../../db/index.js";
import { agentApiKeys } from "../../db/schema.js";
import { generateApiKey } from "../../lib/api-key.js";

export async function createAgentApiKey(
    agentId: string,
    name: string,
) {
    const { apiKey, keyHash } = generateApiKey();

    const [key] = await db
        .insert(agentApiKeys)
        .values({
            agentId,
            name,
            keyHash,
        })
        .returning({
            id: agentApiKeys.id,
            agentId: agentApiKeys.agentId,
            name: agentApiKeys.name,
            createdAt: agentApiKeys.createdAt,
        });

    return {
        apiKey,
        key,
    };
}