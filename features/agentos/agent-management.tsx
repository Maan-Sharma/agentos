"use client";

import { useState, type FormEvent } from "react";
import {
  Bot,
  CalendarDays,
  ChevronLeft,
  Copy,
  Pencil,
  Pause,
  Play,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import type {
  AgentApiKeyResult,
  AgentProvider,
  AgentRecord,
  AgentRole,
  CreateAgentInput,
  UpdateAgentInput,
} from "@/lib/api/agents";
import { Avatar, SectionHeading, StatusPill } from "@/components/agentos/shared";

const providers = ["anthropic", "openai", "google", "other"] as const satisfies readonly AgentProvider[];
const roles = ["sales", "health", "support", "coding", "research", "other"] as const satisfies readonly AgentRole[];

function isAgentProvider(value: string): value is AgentProvider {
  return providers.some((provider) => provider === value);
}

function isAgentRole(value: string): value is AgentRole {
  return roles.some((role) => role === value);
}

type CreateResult = { agent: AgentRecord; key: AgentApiKeyResult } | void;

export function AgentsView({
  agents,
  loading,
  error,
  onSelect,
  onCreate,
  onRetry,
}: {
  agents: AgentRecord[];
  loading: boolean;
  error: string | null;
  onSelect: (agent: AgentRecord) => void;
  onCreate: (input: CreateAgentInput) => Promise<CreateResult>;
  onRetry: () => void;
}) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <>
      <SectionHeading
        eyebrow="YOUR AI TEAM"
        title="Agents"
        subtitle="Manage the agents saved in your workspace."
        action={<button className="button button-primary" onClick={() => setShowCreateDialog(true)}><Bot size={15} />Add an agent</button>}
      />
      <section className="panel agents-panel">
        <div className="panel-heading">
          <div>
            <h2>All agents <span className="count-pill">{loading ? "…" : agents.length}</span></h2>
            <p>Agent details are loaded from your connected backend.</p>
          </div>
          <button className="button button-secondary" onClick={onRetry} disabled={loading}>Refresh</button>
        </div>
        {error && <div className="agent-api-error" role="alert"><span>{error}</span><button className="button button-secondary" onClick={onRetry} disabled={loading}>Retry</button></div>}
        {loading ? (
          <div className="agent-loading-list" aria-label="Loading agents">
            {Array.from({ length: 4 }, (_, index) => <div className="agent-loading-row" key={index}><span /><span /><span /><span /></div>)}
          </div>
        ) : error ? (
          <div className="agent-state-message">Agents could not be loaded. Retry to try again.</div>
        ) : agents.length === 0 ? (
          <div className="agent-state-message"><Bot size={23} /><strong>No agents yet</strong><span>Create your first agent to get started.</span><button className="button button-primary" onClick={() => setShowCreateDialog(true)}>Create an agent</button></div>
        ) : (
          <div className="table-scroll">
            <table className="agent-table">
              <thead><tr><th>Agent</th><th>Status</th><th>Model</th><th>Created</th><th /></tr></thead>
              <tbody>{agents.map((agent) => {
                const initials = agent.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "A";
                return <tr key={agent.id}>
                  <td><button className="agent-name-cell" onClick={() => onSelect(agent)}><Avatar initials={initials} color="lavender" /><span><strong>{agent.name}</strong><small>{agent.description || agent.model}</small></span></button></td>
                  <td><StatusPill status={agent.status} /></td>
                  <td className="table-number">{agent.model}</td>
                  <td className="last-active">{new Date(agent.createdAt).toLocaleDateString()}</td>
                  <td><button className="icon-button table-more" onClick={() => onSelect(agent)} aria-label={`Open ${agent.name}`}>•••</button></td>
                </tr>;
              })}</tbody>
            </table>
          </div>
        )}
      </section>
      <div className="page-footnote">Agent configuration is stored by your workspace backend.</div>
      {showCreateDialog && <AgentFormDialog onClose={() => setShowCreateDialog(false)} onSave={onCreate} />}
    </>
  );
}

export function AgentDetail({
  agent,
  back,
  onUpdate,
  onPause,
  onResume,
  onDelete,
}: {
  agent: AgentRecord;
  back: () => void;
  onUpdate: (agentId: string, input: UpdateAgentInput) => Promise<AgentRecord>;
  onPause: (agentId: string) => Promise<AgentRecord>;
  onResume: (agentId: string) => Promise<AgentRecord>;
  onDelete: (agentId: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const initials = agent.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "A";
  const createdAt = new Date(agent.createdAt).toLocaleString();

  async function runAction(action: () => Promise<AgentRecord>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Could not update this agent.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    setDeleteError(null);
    try {
      await onDelete(agent.id);
      back();
    } catch (actionError) {
      setDeleteError(actionError instanceof Error ? actionError.message : "Could not delete this agent.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button className="back-link" onClick={back}><ChevronLeft size={16} />All agents</button>
      <div className="detail-header">
        <div className="detail-agent"><Avatar initials={initials} color="lavender" /><div><div className="eyebrow">YOUR AI TEAM</div><h1>{agent.name}</h1>{agent.description && <p>{agent.description}</p>}</div></div>
        <div className="detail-actions">
          <StatusPill status={agent.status} />
          <button className="button button-secondary" onClick={() => setEditing(true)} disabled={busy}><Pencil size={14} />Edit</button>
          {agent.status === "paused"
            ? <button className="button button-secondary" onClick={() => void runAction(() => onResume(agent.id))} disabled={busy}><Play size={14} />Resume</button>
            : <button className="button button-secondary" onClick={() => void runAction(() => onPause(agent.id))} disabled={busy}><Pause size={14} />Pause</button>}
          <button className="button button-danger" onClick={() => { setConfirmDelete(true); setDeleteError(null); }} disabled={busy}><Trash2 size={14} />Delete</button>
        </div>
      </div>
      {error && <div className="agent-api-error" role="alert">{error}</div>}
      {confirmDelete && <section className="agent-delete-confirm" aria-live="polite"><ShieldAlert size={19} /><div><strong>Delete {agent.name}?</strong><p>This permanently removes the agent and its associated activity and API keys.</p>{deleteError && <p className="agent-inline-error" role="alert">{deleteError}</p>}<div className="agent-dialog-actions"><button className="button button-secondary" onClick={() => setConfirmDelete(false)} disabled={busy}>Cancel</button><button className="button button-danger" onClick={() => void handleDelete()} disabled={busy}>{busy ? "Deleting…" : "Delete agent"}</button></div></div></section>}
      <div className="detail-meta">
        <span><Bot size={15} />Provider <strong>{agent.provider}</strong></span>
        <span><Bot size={15} />Model <strong>{agent.model}</strong></span>
        <span><Bot size={15} />Role <strong>{agent.role}</strong></span>
        <span><CalendarDays size={15} />Created <strong>{createdAt}</strong></span>
      </div>
      <section className="panel agent-instructions">
        <div className="panel-heading"><div><h2>Instructions</h2><p>System instructions configured for this agent.</p></div></div>
        <p>{agent.instructions}</p>
        <dl className="agent-configuration">
          <div><dt>Monthly budget</dt><dd>{agent.monthlyBudgetUsd === null ? "No limit" : `$${Number(agent.monthlyBudgetUsd).toFixed(2)}`}</dd></div>
          <div><dt>Temperature</dt><dd>{agent.temperature}</dd></div>
          <div><dt>Max tokens per run</dt><dd>{agent.maxTokensPerRun.toLocaleString()}</dd></div>
          <div><dt>Last active</dt><dd>{agent.lastActiveAt ? new Date(agent.lastActiveAt).toLocaleString() : "No activity yet"}</dd></div>
        </dl>
      </section>
      {editing && <AgentFormDialog
        agent={agent}
        onClose={() => setEditing(false)}
        onSave={async (input) => onUpdate(agent.id, input)}
      />}
    </>
  );
}

function AgentFormDialog({
  agent,
  onClose,
  onSave,
}: {
  agent?: AgentRecord;
  onClose: () => void;
  onSave: (input: CreateAgentInput) => Promise<CreateResult | AgentRecord>;
}) {
  const [name, setName] = useState(agent?.name ?? "");
  const [externalId, setExternalId] = useState(agent?.externalId ?? "");
  const [description, setDescription] = useState(agent?.description ?? "");
  const [instructions, setInstructions] = useState(agent?.instructions ?? "No custom instructions configured.");
  const [provider, setProvider] = useState<AgentProvider>(agent?.provider ?? "openai");
  const [model, setModel] = useState(agent?.model ?? "gpt-5.6");
  const [role, setRole] = useState<AgentRole>(agent?.role ?? "other");
  const [budget, setBudget] = useState(agent?.monthlyBudgetUsd ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ agent: AgentRecord; key: AgentApiKeyResult } | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const values: CreateAgentInput = {
      name: name.trim(),
      externalId: externalId.trim() || undefined,
      description: description.trim() || null,
      instructions: instructions.trim(),
      provider,
      model: model.trim(),
      role,
      monthlyBudgetUsd: budget.trim() ? Number(budget) : null,
    };

    try {
      const result = await onSave(values);
      if (!agent && result && "key" in result && result.key) {
        setSuccess(result);
      } else {
        onClose();
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save the agent.");
    } finally {
      setSubmitting(false);
    }
  }

  async function copyKey() {
    if (!success) return;
    try {
      await navigator.clipboard.writeText(success.key.apiKey);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Unable to copy the API key. Select and copy it manually.");
    }
  }

  return (
    <div className="agent-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !submitting) onClose(); }}>
      <section className="agent-dialog" role="dialog" aria-modal="true" aria-labelledby="agent-form-title">
        <div className="panel-heading"><div><h2 id="agent-form-title">{success ? "Agent created" : agent ? "Edit agent" : "Add an agent"}</h2><p>{success ? "Copy the API key for your agent runtime." : "Configure your agent in this workspace."}</p></div><button type="button" className="icon-button" aria-label="Close dialog" onClick={onClose} disabled={submitting}>×</button></div>
        {success ? <div className="agent-connect-success">
          <div className="agent-form-field"><label>Agent ID</label><input readOnly value={success.agent.id} /></div>
          <div className="agent-form-field"><label>AgentOS API key</label><input readOnly value={success.key.apiKey} /></div>
          <div className="agent-dialog-actions"><button type="button" className="button button-secondary" onClick={onClose}>Done</button><button type="button" className="button button-primary" onClick={() => void copyKey()}><Copy size={14} />{copied ? "Copied" : "Copy key"}</button></div>
          <p className="agent-key-note">Store this key securely. It is shown only once.</p>
        </div> : <form onSubmit={(event) => void handleSubmit(event)}>
          <label className="agent-form-field">Name<input autoFocus required minLength={2} maxLength={120} value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label className="agent-form-field">Description <span>(optional)</span><input maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
          {!agent && <label className="agent-form-field">External agent ID <span>(optional)</span><input maxLength={120} value={externalId} onChange={(event) => setExternalId(event.target.value)} placeholder="sales-agent-prod" /></label>}
          <div className="agent-form-grid">
            <label className="agent-form-field">Provider<select value={provider} onChange={(event) => { if (isAgentProvider(event.target.value)) setProvider(event.target.value); }}>{providers.map((item) => <option value={item} key={item}>{item}</option>)}</select></label>
            <label className="agent-form-field">Role<select value={role} onChange={(event) => { if (isAgentRole(event.target.value)) setRole(event.target.value); }}>{roles.map((item) => <option value={item} key={item}>{item}</option>)}</select></label>
          </div>
          <label className="agent-form-field">Model<input required maxLength={100} value={model} onChange={(event) => setModel(event.target.value)} /></label>
          <label className="agent-form-field">Monthly budget (USD) <span>(optional)</span><input type="number" min="0" step="0.01" value={budget} onChange={(event) => setBudget(event.target.value)} placeholder="No limit" /></label>
          <label className="agent-form-field">Instructions<textarea required maxLength={10000} value={instructions} onChange={(event) => setInstructions(event.target.value)} rows={5} /></label>
          {error && <div className="agent-api-error" role="alert">{error}</div>}
          <div className="agent-dialog-actions"><button type="button" className="button button-secondary" onClick={onClose} disabled={submitting}>Cancel</button><button type="submit" className="button button-primary" disabled={submitting}>{submitting ? "Saving…" : agent ? "Save changes" : "Create agent"}</button></div>
        </form>}
      </section>
    </div>
  );
}
