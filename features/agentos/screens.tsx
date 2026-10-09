"use client";

import { useState, type FormEvent } from "react";
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Bot, Building2, CalendarDays, Check, CheckCircle2,
  Bell, ChevronDown, ChevronLeft, ChevronRight, Clock3, CreditCard, Download, Ellipsis, FileText,
  Filter, Gift, Globe2, KeyRound, LayoutGrid, Mail, MessageSquare, MoreHorizontal, Plus, Search,
  Settings, ShieldCheck, Sparkles, Users, Workflow, Zap,
} from "lucide-react";
import type { NavItem } from "@/features/agentos/data";
import { createAgentApiKey, type AgentApiKeyResult, type AgentRecord, type CreateAgentInput } from "@/lib/api/agents";
import { WorkflowCanvas } from "@/components/agentos/workflow-canvas";
import { AgentTable, Avatar, MetricCard, SectionHeading, StatusPill } from "@/components/agentos/shared";

export function HomeView({ agents, loading, error, onRetry, onSelect, setPage }: { agents: AgentRecord[]; loading: boolean; error: string | null; onRetry: () => void; onSelect: (agent: AgentRecord) => void; setPage: (page: NavItem) => void }) {
  const activeCount = agents.filter((agent) => agent.status === "active").length;
  const pausedCount = agents.filter((agent) => agent.status === "paused").length;
  const inactiveCount = agents.filter((agent) => agent.status === "inactive").length;

  return <><SectionHeading eyebrow="YOUR WORKSPACE" title="Your AI team" subtitle="Manage the agents connected to your workspace." action={<button className="button button-primary" onClick={() => setPage("Agents")}><Plus size={15} />Add agent</button>} />
    <div className="metric-grid">
      <MetricCard label="Total agents" value={loading ? "—" : String(agents.length)} note="In this workspace" icon={Bot} tone="metric-lavender" />
      <MetricCard label="Active" value={loading ? "—" : String(activeCount)} note="Currently active" icon={Zap} tone="metric-mint" />
      <MetricCard label="Paused" value={loading ? "—" : String(pausedCount)} note="Paused agents" icon={CheckCircle2} tone="metric-blue" />
      <MetricCard label="Inactive" value={loading ? "—" : String(inactiveCount)} note="Not currently active" icon={CreditCard} tone="metric-peach" />
    </div>
    <section className="panel agents-panel"><div className="panel-heading"><div><h2>Your agents</h2><p>Agents currently saved in your workspace.</p></div><div className="heading-actions"><button className="button button-secondary" onClick={onRetry} disabled={loading}>Refresh</button><button className="text-button" onClick={() => setPage("Agents")}>All agents<ArrowRight size={14} /></button></div></div>{error && <div className="agent-api-error" role="alert">{error}</div>}<AgentTable agents={agents} loading={loading} compact onSelect={onSelect} /></section>
  </>;
}

function LegacyAgentsView({ agents, loading, error, onSelect, onCreate, onRetry }: { agents: AgentRecord[]; loading: boolean; error: string | null; onSelect: (agent: AgentRecord) => void; onCreate: (input: CreateAgentInput) => Promise<{ agent: AgentRecord; key: AgentApiKeyResult } | void>; onRetry: () => void }) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return <><SectionHeading eyebrow="YOUR AI TEAM" title="Agents" subtitle="Manage the agents saved in your workspace." action={<button className="button button-primary" onClick={() => setShowCreateDialog(true)}><Plus size={15} />Add an agent</button>} /><section className="panel agents-panel"><div className="panel-heading"><div><h2>All agents <span className="count-pill">{loading ? "…" : agents.length}</span></h2><p>Agent details are loaded from your connected backend.</p></div><button className="button button-secondary" onClick={onRetry} disabled={loading}><ArrowRight size={14} />Refresh</button></div>{error && <div className="agent-api-error" role="alert">{error}</div>}<AgentTable agents={agents} loading={loading} onSelect={onSelect} /></section><div className="page-footnote"><ShieldCheck size={15} />Agent configuration is stored by your workspace backend.</div>{showCreateDialog && <CreateAgentDialog onClose={() => setShowCreateDialog(false)} onCreate={onCreate} />}</>;
}

function LegacyAgentDetail({ agent, back }: { agent: AgentRecord; back: () => void }) {
  const initials = agent.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "A";
  const createdAt = new Date(agent.createdAt).toLocaleString();

  return <><button className="back-link" onClick={back}><ChevronLeft size={16} />All agents</button><div className="detail-header"><div className="detail-agent"><Avatar initials={initials} color="lavender" /><div><div className="eyebrow">YOUR AI TEAM</div><h1>{agent.name}</h1>{agent.description && <p>{agent.description}</p>}</div></div><div className="detail-actions"><StatusPill status={agent.status} /></div></div><div className="detail-meta"><span><Bot size={15} />Model <strong>{agent.model}</strong></span><span><CalendarDays size={15} />Created <strong>{createdAt}</strong></span></div><section className="panel agent-instructions"><div className="panel-heading"><div><h2>Instructions</h2><p>System instructions configured for this agent.</p></div></div><p>{agent.instructions}</p></section></>;
}

function CreateAgentDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (input: CreateAgentInput) => Promise<{ agent: AgentRecord; key: AgentApiKeyResult } | void> }) {
  const [mode, setMode] = useState<"create" | "connect">("connect");
  const [name, setName] = useState("");
  const [externalId, setExternalId] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("No custom instructions configured.");
  const [model, setModel] = useState("gpt-5.6");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ agent: AgentRecord; key: AgentApiKeyResult } | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const result = await onCreate({
        name: name.trim(),
        externalId: externalId.trim() || undefined,
        description: description.trim() || undefined,
        instructions: instructions.trim() || undefined,
        model: model.trim() || undefined,
      });

      if (result && result.key && result.agent) {
        setSuccess(result);
        return;
      }

      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not create the agent.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopyKey() {
    if (!success) return;

    try {
      await navigator.clipboard.writeText(success.key.apiKey);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Unable to copy the API key automatically. Please copy it manually from the field below.");
    }
  }

  return <div className="agent-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !submitting) onClose(); }}><section className="agent-dialog" role="dialog" aria-modal="true" aria-labelledby="create-agent-title"><div className="panel-heading"><div><h2 id="create-agent-title">{success ? "Connect your agent" : "Add an agent"}</h2><p>{success ? "Your agent is registered and ready to send telemetry." : "Create an agent in your workspace or connect an existing one."}</p></div><button type="button" className="icon-button" aria-label="Close dialog" onClick={onClose} disabled={submitting}>×</button></div>{success ? <div className="agent-connect-success"><div className="agent-success-header"><span className="status-pill status-good"><span className="status-dot" />Agent created</span></div><p>Use this generated AgentOS API key in your external agent runtime.</p><div className="agent-form-field"><label>Agent ID</label><input readOnly value={success.agent.id} /></div><div className="agent-form-field"><label>AgentOS API key</label><input readOnly value={success.key.apiKey} /></div><div className="agent-dialog-actions"><button type="button" className="button button-secondary" onClick={onClose}>Done</button><button type="button" className="button button-primary" onClick={handleCopyKey}>{copied ? "Copied" : "Copy key"}</button></div><p className="agent-key-note">Store the API key as <strong>AGENTOS_API_KEY</strong> in your external agent environment. It is shown once.</p></div> : <form onSubmit={handleSubmit}><div className="agent-mode-switch" role="tablist" aria-label="Agent creation mode"><button type="button" className={mode === "create" ? "mode-pill active" : "mode-pill"} onClick={() => setMode("create")}>Create Agent</button><button type="button" className={mode === "connect" ? "mode-pill active" : "mode-pill"} onClick={() => setMode("connect")}>Connect Existing Agent</button></div><label className="agent-form-field">Name<input autoFocus required minLength={2} maxLength={120} value={name} onChange={(event) => setName(event.target.value)} /></label><label className="agent-form-field">Description <span>(optional)</span><input maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} /></label>{mode === "connect" && <label className="agent-form-field">External Agent ID<input maxLength={120} value={externalId} onChange={(event) => setExternalId(event.target.value)} placeholder="sales-agent-prod" /></label>}<label className="agent-form-field">Instructions<textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} rows={5} /></label><label className="agent-form-field">Model<input value={model} onChange={(event) => setModel(event.target.value)} /></label>{error && <div className="agent-api-error" role="alert">{error}</div>}<div className="agent-dialog-actions"><button type="button" className="button button-secondary" onClick={onClose} disabled={submitting}>Cancel</button><button type="submit" className="button button-primary" disabled={submitting}>{submitting ? "Creating…" : mode === "connect" ? "Create and connect" : "Create agent"}</button></div></form>}</section></div>;
}

export function WorkflowView() {
  return <><SectionHeading eyebrow="AUTOMATIONS" title="Workflows" subtitle="Give your agents a clear path to get great work done." action={<button className="button button-primary"><Plus size={15} />New workflow</button>} /><div className="workflow-toolbar"><div><span className="live-indicator" />Lead qualification <span className="status-pill status-good"><span className="status-dot" />Active</span></div><div className="heading-actions"><button className="button button-secondary"><Ellipsis size={17} />Options</button><button className="button button-primary"><Zap size={15} />Test workflow</button></div></div><div className="workflow-info"><div className="flow-title-icon"><Workflow size={18} /></div><div><strong>New lead → a helpful first conversation</strong><p>When a new lead comes in, find out if they’re a good fit and follow up in the right way.</p></div><div className="workflow-stats"><span><strong>486</strong> runs this month</span><span><strong>98.6%</strong> completed</span></div></div><WorkflowCanvas /><div className="page-footnote"><ShieldCheck size={15} />Your workflow is active and ready. Agents will follow each step automatically.</div></>;
}

export function ActivityView() {
  return <><SectionHeading eyebrow="YOUR WORKSPACE" title="Activity" subtitle="Agent activity will appear here when the activity API is connected." /><section className="panel activity-page-panel"><p className="agent-empty-message">No activity data is available yet.</p></section></>;
}

export function InsightsView() {
  return <><SectionHeading eyebrow="YOUR WORKSPACE" title="Insights" subtitle="Workspace insights will appear when agent usage data is available." /><section className="panel activity-page-panel"><p className="agent-empty-message">No usage data is available yet.</p></section></>;
}

export function ConnectionsView() {
  const connections = [{ name: "Slack", desc: "Send updates where your team works.", icon: MessageSquare, color: "lavender", connected: true }, { name: "HubSpot", desc: "Keep your sales pipeline in sync.", icon: Globe2, color: "peach", connected: true }, { name: "Gmail", desc: "Help your agents draft and send email.", icon: Mail, color: "sky", connected: true }, { name: "Salesforce", desc: "Bring your customer data together.", icon: Building2, color: "mint", connected: false }];
  return <><SectionHeading eyebrow="YOUR WORKSPACE" title="Connections" subtitle="Bring the tools your team already uses together." action={<button className="button button-primary"><Plus size={15} />Browse integrations</button>} /><div className="connection-note"><ShieldCheck size={17} /><span><strong>Your data stays yours.</strong> Connections only share what your agents need to do their jobs.</span><button className="text-button">Learn about security<ArrowRight size={14} /></button></div><div className="connection-grid">{connections.map(({ name, desc, icon: Icon, color, connected }) => <article className="panel connection-card" key={name}><div className={`connection-icon avatar-${color}`}><Icon size={20} /></div><div className="connection-copy"><h3>{name}</h3><p>{desc}</p></div><div className="connection-footer">{connected ? <span className="connected-state"><CheckCircle2 size={14} />Connected</span> : <span className="status-muted-text">Not connected</span>}<button className={connected ? "button button-secondary" : "button button-primary"}>{connected ? "Manage" : "Connect"}</button></div></article>)}</div></>;
}

export function TeamView() {
  const members = [{ name: "Man Mohan", email: "man@acmeco.com", role: "Owner", initials: "MM", color: "lavender" }, { name: "Alex Morgan", email: "alex@acmeco.com", role: "Admin", initials: "AM", color: "sky" }, { name: "Jamie Chen", email: "jamie@acmeco.com", role: "Member", initials: "JC", color: "mint" }, { name: "Taylor Brooks", email: "taylor@acmeco.com", role: "Member", initials: "TB", color: "peach" }];
  return <><SectionHeading eyebrow="YOUR WORKSPACE" title="Team" subtitle="The people looking after your AI team." action={<button className="button button-primary"><Plus size={15} />Invite a teammate</button>} /><div className="metric-strip team-strip"><div><strong>4</strong><span>Team members</span></div><div><strong>1</strong><span>Pending invite</span></div><div><strong>3</strong><span>Active this week</span></div></div><section className="panel agents-panel"><div className="panel-heading"><div><h2>People <span className="count-pill">4</span></h2><p>Manage who can access your workspace.</p></div><button className="button button-secondary"><Users size={15} />Manage roles</button></div><div className="table-scroll"><table className="agent-table team-table"><thead><tr><th>Member</th><th>Role</th><th>Last active</th><th /></tr></thead><tbody>{members.map((member, index) => <tr key={member.email}><td><div className="agent-name-cell"><Avatar initials={member.initials} color={member.color} /><span><strong>{member.name}</strong><small>{member.email}</small></span></div></td><td><span className="role-pill">{member.role}</span></td><td className="last-active">{index === 0 ? "Just now" : index === 1 ? "12 min ago" : index === 2 ? "1 hr ago" : "Yesterday"}</td><td><button className="icon-button"><MoreHorizontal size={18} /></button></td></tr>)}</tbody></table></div></section></>;
}

export { AgentsView, AgentDetail } from "./agent-management";

export function AuditView() {
  const logs = [["Man Mohan", "Updated billing plan", "Billing", "Today, 10:42 AM"], ["Alex Morgan", "Added a new agent", "Agents", "Today, 9:18 AM"], ["Jamie Chen", "Connected Slack", "Connections", "Today, 8:54 AM"], ["Man Mohan", "Invited Taylor Brooks", "Team", "Yesterday, 4:12 PM"], ["Alex Morgan", "Updated workflow settings", "Workflows", "Oct 4, 2:30 PM"]];
  return <><SectionHeading eyebrow="SECURITY & TRANSPARENCY" title="Audit log" subtitle="A thoughtful record of changes across your workspace." action={<button className="button button-secondary"><Download size={15} />Export log</button>} /><div className="audit-note"><ShieldCheck size={17} /><span>For your peace of mind, important workspace changes are recorded here.</span></div><section className="panel agents-panel"><div className="panel-heading"><div><h2>Recent changes</h2><p>Showing the last 30 days.</p></div><button className="button button-secondary"><Filter size={15} />Filter</button></div><div className="table-scroll"><table className="agent-table audit-table"><thead><tr><th>Who</th><th>What happened</th><th>Area</th><th>When</th></tr></thead><tbody>{logs.map(([who, what, area, when]) => <tr key={what}><td><strong>{who}</strong></td><td>{what}</td><td><span className="role-pill">{area}</span></td><td className="last-active">{when}</td></tr>)}</tbody></table></div></section></>;
}

export function BillingView() {
  return <><SectionHeading eyebrow="YOUR ACCOUNT" title="Billing" subtitle="Straightforward pricing, with no surprises." action={<button className="button button-secondary"><FileText size={15} />View all invoices</button>} /><div className="billing-top-grid"><section className="panel current-plan"><div className="plan-topline"><span className="eyebrow">YOUR CURRENT PLAN</span><span className="plan-current-pill"><Check size={13} />Current plan</span></div><h2>Growth</h2><p>For teams ready to do more with AI.</p><div className="plan-price">$149 <span>/ month</span></div><div className="plan-divider" /><div className="usage-line"><span>Agents</span><strong>24 <small>of 30</small></strong></div><div className="usage-track"><span style={{ width: "80%" }} /></div><div className="usage-line execution-line"><span>Monthly executions</span><strong>18,420 <small>of 25,000</small></strong></div><div className="usage-track"><span style={{ width: "73.6%" }} /></div><button className="button button-primary upgrade-button">Explore plans<ArrowRight size={15} /></button></section><section className="panel payment-panel"><div className="panel-heading"><div><h2>Payment details</h2><p>Your next payment is scheduled for Nov 1, 2026.</p></div><button className="text-button">Edit<ArrowRight size={14} /></button></div><div className="payment-method"><div className="card-chip"><CreditCard size={21} /></div><div><strong>Visa ending in 4242</strong><span>Expires 08 / 2028</span></div><span className="default-pill">Default</span></div><div className="billing-contact"><span>Billing email</span><strong>man@acmeco.com</strong></div><div className="billing-contact"><span>Billing address</span><strong>Acme Co. · Bengaluru, India</strong></div></section></div><section className="panel agents-panel invoices-panel"><div className="panel-heading"><div><h2>Recent invoices</h2><p>Your billing history, all in one place.</p></div><button className="text-button">See all invoices<ArrowRight size={14} /></button></div><div className="table-scroll"><table className="agent-table invoice-table"><thead><tr><th>Invoice</th><th>Date</th><th>Amount</th><th>Status</th><th /></tr></thead><tbody>{[["INV-2026-10", "Oct 1, 2026", "$149.00"], ["INV-2026-09", "Sep 1, 2026", "$149.00"], ["INV-2026-08", "Aug 1, 2026", "$149.00"]].map(([invoice, date, amount]) => <tr key={invoice}><td><strong>{invoice}</strong></td><td className="last-active">{date}</td><td className="table-number">{amount}</td><td><span className="status-pill status-good"><span className="status-dot" />Paid</span></td><td><button className="icon-button"><Download size={16} /></button></td></tr>)}</tbody></table></div></section><div className="plan-foot"><Gift size={15} />Need more room? <button className="text-button">Compare all plans<ArrowRight size={14} /></button></div></>;
}

export function SettingsView() {
  const sections = [{ icon: Building2, title: "General", desc: "Workspace name, region and basic details.", badge: "Acme Co." }, { icon: Users, title: "Team", desc: "Members, invitations, roles and permissions.", badge: "4 members" }, { icon: ShieldCheck, title: "Security", desc: "Protect your team with sensible security controls.", badge: "MFA enabled" }, { icon: LayoutGrid, title: "Integrations", desc: "Manage the apps and tools your agents can access.", badge: "3 connected" }, { icon: KeyRound, title: "API keys", desc: "Keys for connecting your own applications.", badge: "2 active" }, { icon: Bell, title: "Notifications", desc: "Choose which updates you’d like to hear about.", badge: "Manage" }];
  return <><SectionHeading eyebrow="MAKE IT YOURS" title="Settings" subtitle="The details that make AgentOS work for your team." /><div className="settings-grid">{sections.map(({ icon: Icon, title, desc, badge }) => <button className="panel settings-card" key={title}><span className="settings-icon"><Icon size={18} /></span><span className="settings-copy"><strong>{title}</strong><small>{desc}</small></span><span className="settings-badge">{badge}</span><ChevronRight size={16} className="settings-arrow" /></button>)}</div><section className="panel security-panel"><div className="panel-heading"><div><h2>Your workspace security</h2><p>A few small things that keep everyone’s work safe.</p></div><span className="security-rating"><ShieldCheck size={15} />Looking good</span></div><div className="security-items"><div><CheckCircle2 size={17} /><span><strong>Multi-factor authentication</strong><small>Extra protection for your sign-in</small></span><span className="security-value">On</span></div><div><CheckCircle2 size={17} /><span><strong>Team access controls</strong><small>Each member has the right level of access</small></span><span className="security-value">Set up</span></div><div><CheckCircle2 size={17} /><span><strong>Audit log</strong><small>Important workspace changes are recorded</small></span><span className="security-value">On</span></div></div></section></>;
}
