import { apiRequest } from "./client";

export type AgentProvider = "anthropic" | "openai" | "google" | "other";
export type AgentRole = "sales" | "health" | "support" | "coding" | "research" | "other";
export type AgentStatus = "active" | "inactive" | "paused";

export type AgentRecord = {
  id: string;
  name: string;
  externalId: string | null;
  description: string | null;
  instructions: string;
  provider: AgentProvider;
  model: string;
  role: AgentRole;
  temperature: number;
  maxTokensPerRun: number;
  monthlyBudgetUsd: string | null;
  status: AgentStatus;
  lastActiveAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AgentInput = {
  name: string;
  externalId?: string | null;
  description?: string | null;
  instructions?: string;
  provider?: AgentProvider;
  model?: string;
  role?: AgentRole;
  temperature?: number;
  maxTokensPerRun?: number;
  monthlyBudgetUsd?: number | null;
};

export type CreateAgentInput = AgentInput;
export type UpdateAgentInput = Partial<AgentInput>;

export type AgentFilters = {
  status?: AgentStatus;
  role?: AgentRole;
};

export type AgentApiKeyResult = {
  apiKey: string;
  key: {
    id: string;
    agentId: string;
    name: string;
    createdAt: string;
  };
};

export function getAgents(filters: AgentFilters = {}) {
  const query = new URLSearchParams();
  if (filters.status) query.set("status", filters.status);
  if (filters.role) query.set("role", filters.role);
  const search = query.size ? `?${query.toString()}` : "";
  return apiRequest<{ agents: AgentRecord[] }>(`/agents${search}`);
}

export function getAgent(agentId: string) {
  return apiRequest<{ agent: AgentRecord }>(`/agents/${agentId}`);
}

export function createAgent(input: CreateAgentInput) {
  return apiRequest<{ agent: AgentRecord }>("/agents", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateAgent(agentId: string, input: UpdateAgentInput) {
  return apiRequest<{ agent: AgentRecord }>(`/agents/${agentId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function pauseAgent(agentId: string) {
  return apiRequest<{ agent: AgentRecord }>(`/agents/${agentId}/pause`, {
    method: "POST",
  });
}

export function resumeAgent(agentId: string) {
  return apiRequest<{ agent: AgentRecord }>(`/agents/${agentId}/resume`, {
    method: "POST",
  });
}

export function deleteAgent(agentId: string) {
  return apiRequest<void>(`/agents/${agentId}`, {
    method: "DELETE",
  });
}

export function createAgentApiKey(agentId: string, name?: string) {
  return apiRequest<AgentApiKeyResult>(`/agents/${agentId}/keys`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}
