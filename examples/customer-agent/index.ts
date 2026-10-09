import { AgentOS } from "../../backend/src/lib/agentos-sdk.js";

const apiKey = process.env.AGENTOS_API_KEY ?? "";

if (!apiKey) {
  throw new Error("AGENTOS_API_KEY is required. Set it before running this example.");
}

async function runCustomerWorkflow(input: string) {
  const startedAt = Date.now();

  const output = `AI workflow completed for: ${input}`;
  const model = "gpt-5.6";

  await new Promise((resolve) => setTimeout(resolve, 150));

  const latencyMs = Date.now() - startedAt;
  const inputTokens = Math.max(40, Math.round(input.length / 4));
  const outputTokens = Math.max(24, Math.round(output.length / 4));
  const totalTokens = inputTokens + outputTokens;

  return {
    input,
    output,
    model,
    inputTokens,
    outputTokens,
    totalTokens,
    latencyMs,
    cost: (totalTokens / 1000) * 0.0025,
    startedAt: new Date(startedAt),
    completedAt: new Date(),
  };
}

async function main() {
  const agent = new AgentOS({
    apiKey,
    baseUrl: process.env.AGENTOS_BASE_URL ?? "http://localhost:4000",
  });

  const input = "Summarize the onboarding workflow for a new enterprise customer.";
  const result = await runCustomerWorkflow(input);
  const modelName = result.model ?? "gpt-5.6";

  const telemetry = await agent.executions.record({
    externalExecutionId: `customer-demo-${Date.now()}`,
    input: result.input,
    output: result.output,
    status: "completed",
    model: modelName,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    totalTokens: result.totalTokens,
    latencyMs: result.latencyMs,
    cost: result.cost,
    startedAt: result.startedAt,
    completedAt: result.completedAt,
  });

  console.log("Telemetry accepted:");
  console.log(JSON.stringify(telemetry, null, 2));
}

void main().catch((error: unknown) => {
  console.error("Customer agent telemetry failed:", error);
  process.exit(1);
});
