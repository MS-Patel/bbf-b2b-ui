import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowUpRight, PiggyBank, Receipt, TrendingUp, Wallet } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatGridSkeleton, ChartSkeleton, DonutSkeleton } from "@/components/feedback/skeletons";
import { AllocationDonut } from "@/features/portfolio/components/allocation-donut";
import { PerformanceChart } from "@/features/portfolio/components/performance-chart";
import { usePortfolioOverviewQuery } from "@/features/portfolio/api";
import { useAuthStore } from "@/stores/auth-store";
import { useImpersonationStore } from "@/features/impersonation/store";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { formatCompactINR, formatINR, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PortfolioSummary } from "@/types/portfolio";

export const Route = createFileRoute("/app/investor/")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    const impersonating = useImpersonationStore.getState().client;
    if (!impersonating && user) throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "Client portfolio — Read-only" }] }),
  component: InvestorDashboard,
});

function InvestorDashboard() {
  const impersonating = useImpersonationStore((s) => s.client);
  const { data, isLoading } = usePortfolioOverviewQuery();
  const displayName = impersonating?.fullName ?? "Client";

  return (
    <>
      <PageHeader
        eyebrow={`Read-only · ${displayName}`}
        title="Client portfolio at a glance"
        description="View this client's holdings, allocation, and performance exactly as they see it."
      />
      <div className="space-y-6 px-6 py-6 sm:px-8">
        {isLoading || !data ? (
          <>
            <StatGridSkeleton />
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
                <ChartSkeleton height={260} />
              </div>
              <div className="rounded-xl border border-border bg-card p-6">
                <DonutSkeleton />
              </div>
            </div>
          </>
        ) : (
          <>
            <StatGrid summary={data.summary} />

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="shadow-card lg:col-span-2">
                <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
                  <div>
                    <CardTitle>Performance</CardTitle>
                    <CardDescription>Last 12 months · value vs invested.</CardDescription>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="gap-1">
                    <Link to="/app/investor/portfolio">
                      Open portfolio <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent className="px-2 pb-4 sm:px-4">
                  <PerformanceChart data={data.performance} height={260} />
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Asset mix</CardTitle>
                  <CardDescription>Allocation by asset class.</CardDescription>
                </CardHeader>
                <CardContent>
                  <AllocationDonut
                    data={data.byAssetClass}
                    centerLabel="Net worth"
                    centerValue={formatCompactINR(data.summary.netWorth)}
                  />
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Top holdings</CardTitle>
                  <CardDescription>The largest positions by current value.</CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm" className="gap-1">
                  <Link to="/app/investor/portfolio">
                    See all <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.topHoldings.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between gap-4 rounded-lg border border-border bg-secondary/30 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{h.schemeName}</p>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        {h.amc} · {h.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold tabular-nums">{formatINR(h.currentValue)}</p>
                      <p className={cn("text-xs font-medium tabular-nums", h.returnPct >= 0 ? "text-profit" : "text-loss")}>
                        {formatPercent(h.returnPct)}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
}

function StatGrid({ summary }: { summary: PortfolioSummary }) {
  const stats = [
    { label: "Net worth", value: formatCompactINR(summary.netWorth), change: summary.todayChangePct, icon: Wallet, tone: "primary" as const },
    { label: "Invested", value: formatCompactINR(summary.invested), change: 0, icon: PiggyBank, tone: "muted" as const },
    { label: "Returns (XIRR)", value: formatPercent(summary.xirr), change: summary.absoluteReturnPct, icon: TrendingUp, tone: "success" as const },
    { label: "This month SIP", value: formatCompactINR(summary.monthlySip), change: 0, icon: Receipt, tone: "muted" as const },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((s) => {
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
              <p className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <p className="mt-1 font-display text-2xl font-bold tabular-nums">{s.value}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
