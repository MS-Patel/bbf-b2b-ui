import { createFileRoute, redirect } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ChartSkeleton, DonutSkeleton, TableSkeleton } from "@/components/feedback/skeletons";
import { AllocationDonut } from "@/features/portfolio/components/allocation-donut";
import { PerformanceChart } from "@/features/portfolio/components/performance-chart";
import { SectorBarChart } from "@/features/portfolio/components/sector-bar-chart";
import { HoldingsTable } from "@/features/portfolio/components/holdings-table";
import { usePortfolioOverviewQuery, useHoldingsQuery } from "@/features/portfolio/api";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { formatCompactINR, formatINR, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/app/investor/portfolio")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "investor") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "Portfolio — WealthOS" }] }),
  component: PortfolioPage,
});

function PortfolioPage() {
  const { data, isLoading } = usePortfolioOverviewQuery();
  const holdings = useHoldingsQuery();

  return (
    <>
      <PageHeader
        eyebrow="Portfolio"
        title="Holdings & analytics"
        description="Asset allocation, sector exposure, and performance across every fund you hold."
      />

      <div className="space-y-6 px-6 py-6 sm:px-8">
        {isLoading || !data ? (
          <>
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
                <ChartSkeleton height={280} />
              </div>
              <div className="rounded-xl border border-border bg-card p-6">
                <DonutSkeleton />
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <TableSkeleton rows={6} cols={6} />
            </div>
          </>
        ) : (
          <>
            <SummaryStrip
              netWorth={data.summary.netWorth}
              invested={data.summary.invested}
              gain={data.summary.unrealizedGain}
              returnPct={data.summary.absoluteReturnPct}
              xirr={data.summary.xirr}
              todayChange={data.summary.todayChange}
              todayChangePct={data.summary.todayChangePct}
            />

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="shadow-card lg:col-span-2">
                <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
                  <div>
                    <CardTitle>Performance</CardTitle>
                    <CardDescription>Portfolio value vs invested capital — last 12 months.</CardDescription>
                  </div>
                  <Legend />
                </CardHeader>
                <CardContent className="px-2 pb-4 sm:px-4">
                  <PerformanceChart data={data.performance} />
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Allocation</CardTitle>
                  <CardDescription>Breakdown of current value.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="asset">
                    <TabsList className="w-full">
                      <TabsTrigger value="asset" className="flex-1">By asset</TabsTrigger>
                      <TabsTrigger value="category" className="flex-1">By category</TabsTrigger>
                    </TabsList>
                    <TabsContent value="asset" className="mt-4">
                      <AllocationDonut
                        data={data.byAssetClass}
                        centerLabel="Net worth"
                        centerValue={formatCompactINR(data.summary.netWorth)}
                      />
                    </TabsContent>
                    <TabsContent value="category" className="mt-4">
                      <AllocationDonut
                        data={data.byCategory}
                        centerLabel="Categories"
                        centerValue={`${data.byCategory.length}`}
                      />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Equity sector exposure</CardTitle>
                <CardDescription>Pass-through weights from underlying scheme portfolios.</CardDescription>
              </CardHeader>
              <CardContent>
                <SectorBarChart data={data.bySector} />
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>All holdings</CardTitle>
                <CardDescription>Search, filter, and sort across every position.</CardDescription>
              </CardHeader>
              <CardContent>
                {holdings.isLoading || !holdings.data ? (
                  <TableSkeleton rows={6} cols={6} />
                ) : (
                  <HoldingsTable holdings={holdings.data} />
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
}

function Legend() {
  return (
    <div className="hidden items-center gap-4 text-xs sm:flex">
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-accent" /> Value
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-0 w-3 border-t-2 border-dashed border-muted-foreground" /> Invested
      </span>
    </div>
  );
}

function SummaryStrip({
  netWorth,
  invested,
  gain,
  returnPct,
  xirr,
  todayChange,
  todayChangePct,
}: {
  netWorth: number;
  invested: number;
  gain: number;
  returnPct: number;
  xirr: number;
  todayChange: number;
  todayChangePct: number;
}) {
  const positive = gain >= 0;
  const todayPositive = todayChange >= 0;
  return (
    <Card className="overflow-hidden shadow-card">
      <CardContent className="p-0">
        <div className="grid grid-cols-1 divide-y divide-border lg:grid-cols-5 lg:divide-x lg:divide-y-0">
          <div className="bg-gradient-to-br from-primary to-primary-glow p-6 text-primary-foreground lg:col-span-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/70">
              Current value
            </p>
            <p className="mt-2 font-display text-3xl font-bold tabular-nums sm:text-4xl">{formatINR(netWorth)}</p>
            <p className="mt-1 text-xs text-primary-foreground/80">Invested {formatINR(invested)}</p>
            <Badge
              className={cn(
                "mt-3 border-0 font-semibold",
                todayPositive ? "bg-success/25 text-success-foreground" : "bg-destructive/25 text-destructive-foreground",
              )}
            >
              {todayPositive ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
              {formatINR(Math.abs(todayChange))} today ({formatPercent(todayChangePct)})
            </Badge>
          </div>
          <SummaryStat
            label="Unrealized gain"
            value={formatINR(gain)}
            sub={formatPercent(returnPct)}
            positive={positive}
          />
          <SummaryStat label="XIRR" value={formatPercent(xirr)} sub="Since inception" positive={xirr >= 0} />
          <SummaryStat label="Holdings" value="8 funds" sub="4 with active SIP" />
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryStat({
  label,
  value,
  sub,
  positive,
}: {
  label: string;
  value: string;
  sub: string;
  positive?: boolean;
}) {
  return (
    <div className="p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-2 font-display text-2xl font-bold tabular-nums",
          positive === true && "text-profit",
          positive === false && "text-loss",
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
