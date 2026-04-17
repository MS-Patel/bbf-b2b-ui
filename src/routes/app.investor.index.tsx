import { createFileRoute, redirect } from "@tanstack/react-router";
import { ArrowUpRight, Wallet, TrendingUp, PiggyBank, Receipt } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ComingSoonCard } from "@/components/layout/coming-soon-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { formatCompactINR, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/investor/")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "investor") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "Investor dashboard — WealthOS" }] }),
  component: InvestorDashboard,
});

const STATS = [
  { label: "Net worth", value: 8423500, change: 12.4, icon: Wallet, tone: "primary" as const },
  { label: "Invested", value: 6800000, change: 0, icon: PiggyBank, tone: "muted" as const },
  { label: "Returns (XIRR)", value: 1623500, change: 18.7, icon: TrendingUp, tone: "success" as const },
  { label: "This month SIP", value: 45000, change: 0, icon: Receipt, tone: "muted" as const },
];

function InvestorDashboard() {
  const user = useAuthStore((s) => s.user);
  return (
    <>
      <PageHeader
        eyebrow={`Welcome back, ${user?.fullName.split(" ")[0] ?? "Investor"}`}
        title="Your wealth, at a glance"
        description="Track holdings, run SIPs, and execute orders on BSE Star MF — all in one place."
        actions={
          <>
            <Button variant="outline">Add funds</Button>
            <Button className="gap-2">
              Start SIP <ArrowUpRight className="h-4 w-4" />
            </Button>
          </>
        }
      />
      <div className="space-y-6 px-6 py-6 sm:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {STATS.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className="overflow-hidden shadow-card">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div
                      className={cn(
                        "grid h-10 w-10 place-items-center rounded-xl",
                        s.tone === "primary" && "gradient-brand text-primary-foreground shadow-glow",
                        s.tone === "success" && "gradient-accent text-accent-foreground shadow-glow",
                        s.tone === "muted" && "bg-secondary text-foreground",
                      )}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    {s.change !== 0 && (
                      <Badge
                        variant="secondary"
                        className={cn(
                          "border-0 font-semibold",
                          s.change > 0 ? "bg-success/12 text-success" : "bg-destructive/12 text-destructive",
                        )}
                      >
                        {formatPercent(s.change)}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold tabular-nums">
                    {formatCompactINR(s.value)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <ComingSoonCard
          feature="Portfolio analytics, holdings, asset allocation & full transaction history"
          description="Phase 2 brings deep portfolio insights, BSE Star MF order execution, KYC tracker, and the goal-based investing wizard."
        />
      </div>
    </>
  );
}
