import { config } from "./config.js";
import { createApp } from "./app.js";

async function startServer() {
  const app = await createApp();

  try {
    await app.listen({
      port: config.PORT,
      host: "0.0.0.0",
    });

    console.log(`AgentOS API running on http://localhost:${config.PORT}`);
  } catch (error) {
    app.log.error(error);
    throw error;
  }
}

void startServer().catch((error: unknown) => {
  console.error("Failed to start AgentOS API:", error);
  process.exit(1);
});