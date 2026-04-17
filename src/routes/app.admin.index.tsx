import { createFileRoute, redirect } from "@tanstack/react-router";
import { Users, Wallet, Activity, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ComingSoonCard } from "@/components/layout/coming-soon-card";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { formatCompactINR } from "@/lib/format";

export const Route = createFileRoute("/app/admin/")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "admin") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "Admin overview — WealthOS" }] }),
  component: AdminDashboard,
});

const STATS = [
  { label: "Total AUM", value: formatCompactINR(24_000_000_000), icon: Wallet },
  { label: "Active investors", value: "12,847", icon: Users },
  { label: "Orders today", value: "3,214", icon: Activity },
  { label: "KYC pending", value: "186", icon: ShieldCheck },
];

function AdminDashboard() {
  return (
    <>
      <PageHeader
        eyebrow="Admin console"
        title="System overview"
        description="Monitor platform health, AUM, reconciliation pipelines, and operational throughput."
      />
      <div className="space-y-6 px-6 py-6 sm:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {STATS.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className="shadow-card">
                <CardContent className="p-5">
                  <div className="grid h-10 w-10 place-items-center rounded-xl gradient-brand text-primary-foreground shadow-glow">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <p className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold tabular-nums">{s.value}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <ComingSoonCard
          feature="User & role management, RTA reconciliation, commissions, and integration logs"
          description="Phase 2 wires up the full admin operations suite including BSE & NDML status dashboards."
        />
      </div>
    </>
  );
}
