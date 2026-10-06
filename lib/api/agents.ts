import { apiRequest } from "./client";

export type AgentRecord = {
  id: string;
  name: string;
  description: string | null;
  instructions: string;
  model: string;
  status: "active" | "inactive" | "paused";
  createdAt: string;
  updatedAt: string;
};

export type CreateAgentInput = {
  name: string;
  description?: string;
  instructions: string;
  model?: string;
};

export function getAgents() {
  return apiRequest<{ agents: AgentRecord[] }>("/agents");
}

export function createAgent(input: CreateAgentInput) {
  return apiRequest<{ agent: AgentRecord }>("/agents", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
