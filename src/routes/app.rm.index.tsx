import { createFileRoute, redirect } from "@tanstack/react-router";
import { Users, TrendingUp, HandCoins, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ComingSoonCard } from "@/components/layout/coming-soon-card";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { formatCompactINR } from "@/lib/format";

export const Route = createFileRoute("/app/rm/")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "rm") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "Relationship Manager — WealthOS" }] }),
  component: RmDashboard,
});

const STATS = [
  { label: "Clients", value: "248", icon: Users },
  { label: "AUM under service", value: formatCompactINR(420_000_000), icon: TrendingUp },
  { label: "MTD commissions", value: formatCompactINR(380_000), icon: HandCoins },
  { label: "Onboarding pipeline", value: "32", icon: ShieldCheck },
];

function RmDashboard() {
  const user = useAuthStore((s) => s.user);
  return (
    <>
      <PageHeader
        eyebrow={`Hi ${user?.fullName.split(" ")[0] ?? "RM"}`}
        title="Your client book"
        description="Service your roster, track onboarding, and review commissions earned this cycle."
      />
      <div className="space-y-6 px-6 py-6 sm:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {STATS.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className="shadow-card">
                <CardContent className="p-5">
                  <div className="grid h-10 w-10 place-items-center rounded-xl gradient-accent text-accent-foreground shadow-glow">
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
          feature="Client roster grid, impersonation view, and earnings analytics"
          description="Phase 2 ships the full RM workspace — drill into any client portfolio and track lead-to-investor conversion."
        />
      </div>
    </>
  );
}
