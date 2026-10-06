"use client";

import type { AgentRecord } from "@/lib/api/agents";
import { ArrowUpRight, Bot, MoreHorizontal } from "lucide-react";

export function StatusPill({ status }: { status: AgentRecord["status"] }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  const tone = status === "active" ? "status-good" : status === "paused" ? "status-warn" : "status-muted";

  return <span className={`status-pill ${tone}`}><span className="status-dot" />{label}</span>;
}

export function Avatar({ initials, color, small = false }: { initials: string; color: string; small?: boolean }) {
  return <span className={`avatar avatar-${color} ${small ? "avatar-small" : ""}`}>{initials}</span>;
}

export function SectionHeading({ eyebrow, title, subtitle, action }: { eyebrow?: string; title: string; subtitle?: string; action?: React.ReactNode }) {
  return <div className="section-heading"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{action}</div>;
}

export function MetricCard({ label, value, note, icon: Icon, trend, tone }: { label: string; value: string; note: string; icon: typeof Bot; trend?: string; tone: string }) {
  return <div className="metric-card"><div className="metric-top"><span>{label}</span><span className={`metric-icon ${tone}`}><Icon size={17} /></span></div><div className="metric-value">{value}</div><div className="metric-note">{trend && <span className="trend"><ArrowUpRight size={13} />{trend}</span>}{note}</div></div>;
}

export function AgentIcon({ agent, onClick }: { agent: AgentRecord; onClick: () => void }) {
  const initials = agent.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return <button className="agent-name-cell" onClick={onClick} aria-label={`View ${agent.name}`}><Avatar initials={initials || "A"} color="lavender" /><span><strong>{agent.name}</strong><small>{agent.description || agent.model}</small></span></button>;
}

export function AgentTable({ agents, onSelect, compact = false, loading = false }: { agents: AgentRecord[]; onSelect: (agent: AgentRecord) => void; compact?: boolean; loading?: boolean }) {
  const rows = compact ? agents.slice(0, 4) : agents;

  return <div className="table-scroll"><table className="agent-table"><thead><tr><th>Agent</th><th>Status</th><th>Model</th><th>Created</th><th /></tr></thead><tbody>{loading ? <tr><td colSpan={5} className="agent-table-message">Loading agents…</td></tr> : rows.length === 0 ? <tr><td colSpan={5} className="agent-table-message">No agents yet. Add your first agent to get started.</td></tr> : rows.map((agent) => <tr key={agent.id}><td><AgentIcon agent={agent} onClick={() => onSelect(agent)} /></td><td><StatusPill status={agent.status} /></td><td className="table-number">{agent.model}</td><td className="last-active">{new Date(agent.createdAt).toLocaleDateString()}</td><td><button className="icon-button table-more" onClick={() => onSelect(agent)} aria-label={`Open ${agent.name}`}><MoreHorizontal size={18} /></button></td></tr>)}</tbody></table></div>;
}
