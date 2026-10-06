import { Activity, Bot, CreditCard, FileText, Home, LayoutGrid, Settings, Sparkles, Users, Workflow } from "lucide-react";

export type NavItem = "Home" | "Agents" | "Workflows" | "Activity" | "Insights" | "Connections" | "Team" | "Audit Log" | "Settings" | "Billing";

export const primaryNav: { name: NavItem; icon: typeof Home }[] = [
  { name: "Home", icon: Home }, { name: "Agents", icon: Bot }, { name: "Workflows", icon: Workflow },
  { name: "Activity", icon: Activity }, { name: "Insights", icon: Sparkles },
];
export const workspaceNav: { name: NavItem; icon: typeof Home }[] = [
  { name: "Connections", icon: LayoutGrid }, { name: "Team", icon: Users }, { name: "Audit Log", icon: FileText },
];
export const accountNav: { name: NavItem; icon: typeof Home }[] = [
  { name: "Settings", icon: Settings }, { name: "Billing", icon: CreditCard },
];
