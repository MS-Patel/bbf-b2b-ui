import {
  LayoutDashboard,
  Wallet,
  ShieldCheck,
  Users,
  FileSpreadsheet,
  Activity,
  HandCoins,
  Briefcase,
  Bell,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/types/auth";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  badge?: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

const adminNav: NavSection[] = [
  {
    label: "Operations",
    items: [
      { label: "Overview", to: "/app/admin", icon: LayoutDashboard },
      { label: "Users & Roles", to: "/app/admin/users", icon: Users },
      { label: "Reconciliation", to: "/app/admin/reconciliation", icon: FileSpreadsheet },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Commissions", to: "/app/admin/commissions", icon: HandCoins },
      { label: "Payouts", to: "/app/admin/payouts", icon: Wallet },
    ],
  },
  {
    label: "System",
    items: [{ label: "Integrations & Logs", to: "/app/admin/system", icon: Activity }],
  },
];

const rmNav: NavSection[] = [
  {
    label: "Clients",
    items: [
      { label: "Overview", to: "/app/rm", icon: LayoutDashboard },
      { label: "Client Roster", to: "/app/rm/clients", icon: Users },
      { label: "Onboarding", to: "/app/rm/onboarding", icon: ShieldCheck },
    ],
  },
  {
    label: "Business",
    items: [{ label: "Earnings", to: "/app/rm/earnings", icon: HandCoins }],
  },
];

const distributorNav: NavSection[] = [
  {
    label: "Business",
    items: [
      { label: "Overview", to: "/app/distributor", icon: LayoutDashboard },
      { label: "AUM", to: "/app/distributor/aum", icon: Briefcase },
      { label: "Commissions", to: "/app/distributor/commissions", icon: HandCoins },
    ],
  },
];

export const NAV_BY_ROLE: Record<UserRole, NavSection[]> = {
  admin: adminNav,
  rm: rmNav,
  distributor: distributorNav,
};

export const SHARED_BOTTOM_NAV: NavItem[] = [
  { label: "Notifications", to: "/app/notifications", icon: Bell },
  { label: "Settings", to: "/app/settings", icon: Settings },
];
