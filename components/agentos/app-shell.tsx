"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, Bell, Bot, ChevronDown, ChevronRight, CircleHelp, Menu, MoreHorizontal, Search } from "lucide-react";
import { accountNav, primaryNav, workspaceNav, type NavItem } from "@/features/agentos/data";
import { ActivityView, AgentDetail, AgentsView, AuditView, BillingView, ConnectionsView, HomeView, InsightsView, SettingsView, TeamView, WorkflowView } from "@/features/agentos/screens";
import { Avatar } from "@/components/agentos/shared";
import { createAgent, getAgents, type AgentRecord, type CreateAgentInput } from "@/lib/api/agents";

export function AgentOS() {
  const [page, setPage] = useState<NavItem>("Home");
  const [selectedAgent, setSelectedAgent] = useState<AgentRecord | null>(null);
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [agentsError, setAgentsError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const title = selectedAgent ? "Agents" : page;

  useEffect(() => {
    let cancelled = false;

    getAgents()
      .then((result) => {
        if (!cancelled) {
          setAgents(result.agents);
          setAgentsError(null);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setAgentsError(error instanceof Error ? error.message : "Could not load agents.");
        }
      })
      .finally(() => {
        if (!cancelled) setAgentsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const refreshAgents = useCallback(async () => {
    setAgentsLoading(true);
    try {
      const result = await getAgents();
      setAgents(result.agents);
      setAgentsError(null);
    } catch (error) {
      setAgentsError(error instanceof Error ? error.message : "Could not load agents.");
    } finally {
      setAgentsLoading(false);
    }
  }, []);

  const handleCreateAgent = useCallback(async (input: CreateAgentInput) => {
    const result = await createAgent(input);
    setAgents((currentAgents) => [result.agent, ...currentAgents]);
    setAgentsError(null);
  }, []);

  const pageContent = useMemo(() => {
    if (selectedAgent) return <AgentDetail agent={selectedAgent} back={() => setSelectedAgent(null)} />;
    switch (page) {
      case "Home": return <HomeView agents={agents} loading={agentsLoading} error={agentsError} onRetry={refreshAgents} onSelect={setSelectedAgent} setPage={setPage} />;
      case "Agents": return <AgentsView agents={agents} loading={agentsLoading} error={agentsError} onSelect={setSelectedAgent} onCreate={handleCreateAgent} onRetry={refreshAgents} />;
      case "Workflows": return <WorkflowView />;
      case "Activity": return <ActivityView />;
      case "Insights": return <InsightsView />;
      case "Connections": return <ConnectionsView />;
      case "Team": return <TeamView />;
      case "Audit Log": return <AuditView />;
      case "Billing": return <BillingView />;
      case "Settings": return <SettingsView />;
    }
  }, [agents, agentsError, agentsLoading, handleCreateAgent, page, refreshAgents, selectedAgent]);

  const navigate = (name: NavItem) => { setSelectedAgent(null); setPage(name); setSidebarOpen(false); };
  const renderNav = (items: typeof primaryNav) => items.map(({ name, icon: Icon }) => <button className={`nav-item ${title === name ? "nav-active" : ""}`} key={name} onClick={() => navigate(name)}><Icon size={17} strokeWidth={title === name ? 2.1 : 1.8} /><span>{name}</span></button>);

  return <div className="app-shell">
    {sidebarOpen && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setSidebarOpen(false)} />}
    <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
      <button className="workspace-switch"><span className="brand-mark"><Bot size={19} strokeWidth={2.3} /></span><span className="workspace-name"><strong>AgentOS</strong><small>Acme Co. workspace</small></span><ChevronDown size={15} className="workspace-chevron" /></button>
      <div className="sidebar-divider" />
      <div className="nav-label">WORKSPACE</div><nav className="nav-group">{renderNav(primaryNav)}</nav>
      <div className="nav-label nav-label-spaced">MANAGE</div><nav className="nav-group">{renderNav(workspaceNav)}</nav>
      <div className="sidebar-bottom"><div className="nav-label">ACCOUNT</div><nav className="nav-group">{renderNav(accountNav)}</nav><button className="usage-card" onClick={() => navigate("Billing")}><div className="usage-card-top"><span>Monthly AI spend</span><ArrowRight size={14} /></div><strong>$1,284 <small>of $2,000</small></strong><div className="usage-bar"><span /></div><span className="usage-foot">Resets Nov 1 <span>64%</span></span></button><div className="user-profile"><Avatar initials="MM" color="lavender" /><span><strong>Man Mohan</strong><small>Workspace owner</small></span><button className="icon-button profile-menu" aria-label="Profile menu"><MoreHorizontal size={18} /></button></div></div>
    </aside>
    <main className="main-area"><header className="topbar"><div className="topbar-left"><button className="icon-button mobile-menu" aria-label="Open menu" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button><div className="breadcrumb">Acme Co. <ChevronRight size={14} /><span>{selectedAgent ? selectedAgent.name : page}</span></div></div><div className="topbar-right"><button className="search-trigger" onClick={() => navigate("Agents")}><Search size={16} /><span>Search anything...</span><kbd>⌘ K</kbd></button><button className="icon-button help-button" aria-label="Help"><CircleHelp size={18} /></button><div className="notification-wrap"><button className="icon-button notification-button" aria-label="Notifications" onClick={() => setShowNotifications(!showNotifications)}><Bell size={18} /></button>{showNotifications && <div className="notification-popover"><div className="notification-heading">Notifications</div><p className="notification-empty">No new notifications.</p></div>}</div><div className="topbar-divider" /><button className="topbar-avatar"><Avatar initials="MM" color="lavender" /><ChevronDown size={13} /></button></div></header><div className="page-content">{pageContent}</div><footer className="app-footer"><span>© 2026 AgentOS</span><span>Thoughtful AI, working for you.</span><button><CircleHelp size={13} />Help center</button></footer></main>
  </div>;
}
