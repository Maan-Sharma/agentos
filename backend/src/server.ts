import "dotenv/config";
import { createApp } from "./app.js";

const port = Number(process.env.PORT ?? 4000);

async function startServer() {
  const app = await createApp();

  try {
    await app.listen({
      port,
      host: "0.0.0.0",
    });

    console.log(`AgentOS API running on http://localhost:${port}`);
  } catch (error) {
    app.log.error(error);
    throw error;
  }
}

void startServer().catch((error: unknown) => {
  console.error("Failed to start AgentOS API:", error);
  process.exit(1);
});