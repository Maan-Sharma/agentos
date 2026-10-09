export type ExecutionStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "error";

export type ExecutionTelemetry = {
  externalExecutionId?: string;
  input: string;
  output?: string | null;
  status?: ExecutionStatus;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  latencyMs?: number;
  cost?: string | number;
  error?: string | null;
  startedAt?: string | Date;
  completedAt?: string | Date;
};

export type AgentOSOptions = {
  apiKey: string;
  baseUrl?: string;
};

export class AgentOS {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor({ apiKey, baseUrl = "http://localhost:4000" }: AgentOSOptions) {
    if (!apiKey) {
      throw new Error("AgentOS apiKey is required.");
    }

    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  readonly executions = {
    record: async (payload: ExecutionTelemetry) => {
      const response = await fetch(`${this.baseUrl}/api/ingest/executions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          ...payload,
          startedAt: payload.startedAt ? new Date(payload.startedAt).toISOString() : new Date().toISOString(),
          completedAt: payload.completedAt ? new Date(payload.completedAt).toISOString() : new Date().toISOString(),
        }),
      });

      const data = await response.json().catch(() => undefined);

      if (!response.ok) {
        throw new Error(
          data?.error ?? `Telemetry submission failed with status ${response.status}`,
        );
      }

      return data;
    },
  };
}
