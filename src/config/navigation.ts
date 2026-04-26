import {
  LayoutDashboard,
  Wallet,
  ShieldCheck,
  Users,
  FileSpreadsheet,
  Activity,
  HandCoins,
  Briefcase,
  Building2,
  Bell,
  Database,
  Layers,
  Settings,
  ShoppingCart,
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
      { label: "Distributors", to: "/app/admin/distributors", icon: Briefcase },
      { label: "RMs", to: "/app/admin/rms", icon: Users },
      { label: "Mappings", to: "/app/admin/mappings", icon: Activity },
      { label: "Onboarding", to: "/app/admin/onboarding", icon: ShieldCheck },
      { label: "Orders", to: "/app/admin/orders", icon: ShoppingCart },
      { label: "Branches", to: "/app/admin/branches", icon: Building2 },
      { label: "Reconciliation", to: "/app/admin/reconciliation", icon: FileSpreadsheet },
    ],
  },
  {
    label: "Configuration",
    items: [{ label: "Master Data", to: "/app/admin/master-data", icon: Database }],
  },
  {
    label: "Finance",
    items: [
      { label: "Commissions", to: "/app/admin/commissions", icon: HandCoins },
      { label: "Payouts", to: "/app/admin/payouts", icon: Wallet },
      { label: "Brokerage Imports", to: "/app/admin/brokerage-imports", icon: FileSpreadsheet },
      { label: "Distributor Categories", to: "/app/admin/distributor-categories", icon: Layers },
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
      { label: "Distributors", to: "/app/rm/distributors", icon: Briefcase },
      { label: "Onboarding", to: "/app/rm/onboarding", icon: ShieldCheck },
      { label: "Orders", to: "/app/rm/orders", icon: ShoppingCart },
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
      { label: "Onboarding", to: "/app/distributor/onboarding", icon: ShieldCheck },
      { label: "Orders", to: "/app/distributor/orders", icon: ShoppingCart },
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
