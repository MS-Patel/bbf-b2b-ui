import { createFileRoute, redirect } from "@tanstack/react-router";
import { Briefcase, HandCoins, TrendingUp, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ComingSoonCard } from "@/components/layout/coming-soon-card";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { formatCompactINR } from "@/lib/format";

export const Route = createFileRoute("/app/distributor/")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "distributor") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "Distributor — WealthOS" }] }),
  component: DistributorDashboard,
});

const STATS = [
  { label: "Total AUM", value: formatCompactINR(1_240_000_000), icon: Briefcase },
  { label: "RMs under you", value: "18", icon: Users },
  { label: "QTD growth", value: "+8.4%", icon: TrendingUp },
  { label: "Pending payouts", value: formatCompactINR(2_400_000), icon: HandCoins },
];

function DistributorDashboard() {
  return (
    <>
      <PageHeader
        eyebrow="Distributor console"
        title="Your distribution network"
        description="Track AUM growth across your RMs, monitor commission cycles, and reconcile payouts."
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
          feature="Sub-broker hierarchy, AUM analytics, and automated commission mapping"
          description="Phase 2 brings full multi-tier distributor reporting and payout automation."
        />
      </div>
    </>
  );
}
