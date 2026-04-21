import { useMemo, useState } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  CircleDot,
  Compass,
  HandCoins,
  LineChart,
  RefreshCw,
  Repeat2,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartSkeleton } from "@/components/feedback/skeletons";

import { useInsightsOverviewQuery } from "@/features/insights/api";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Insight, InsightCategory, InsightSeverity, InsightsOverview } from "@/types/insights";

export const Route = createFileRoute("/app/investor/insights")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "investor") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "AI Insights — BuyBestFin" }] }),
  component: InsightsPage,
});

const CATEGORY_ICON: Record<InsightCategory, typeof Brain> = {
  rebalance: Repeat2,
  tax: HandCoins,
  performance: LineChart,
  concentration: AlertTriangle,
  fees: HandCoins,
  goal: Target,
  market: TrendingUp,
  discovery: Compass,
};

const CATEGORY_LABEL: Record<InsightCategory, string> = {
  rebalance: "Rebalance",
  tax: "Tax",
  performance: "Performance",
  concentration: "Concentration",
  fees: "Fees",
  goal: "Goal",
  market: "Market",
  discovery: "Discovery",
};

const SEVERITY_TONE: Record<InsightSeverity, { ring: string; chip: string; label: string }> = {
  info: { ring: "border-border", chip: "bg-secondary text-foreground", label: "Info" },
  opportunity: { ring: "border-success/30", chip: "bg-success/12 text-success", label: "Opportunity" },
  warning: { ring: "border-warning/30", chip: "bg-warning/15 text-warning", label: "Warning" },
  critical: { ring: "border-destructive/30", chip: "bg-destructive/12 text-destructive", label: "Critical" },
};

type FilterKey = "all" | InsightCategory;

function InsightsPage() {
  const { data, isLoading, refetch, isFetching } = useInsightsOverviewQuery();
  const [filter, setFilter] = useState<FilterKey>("all");

  const insights = useMemo(() => {
    if (!data) return [];
    return filter === "all" ? data.insights : data.insights.filter((i) => i.category === filter);
  }, [data, filter]);

  const filterCounts = useMemo(() => {
    if (!data) return new Map<InsightCategory, number>();
    const map = new Map<InsightCategory, number>();
    for (const i of data.insights) map.set(i.category, (map.get(i.category) ?? 0) + 1);
    return map;
  }, [data]);

  return (
    <>
      <PageHeader
        eyebrow="Beta"
        title="AI Insights"
        description="Personalized recommendations from our portfolio brain — refreshed daily."
        actions={
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              refetch();
              toast.success("Insights refreshed");
            }}
            disabled={isFetching}
          >
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} /> Refresh
          </Button>
        }
      />

      <div className="space-y-6 px-6 py-6 sm:px-8">
        {isLoading || !data ? (
          <Card className="shadow-card">
            <CardContent className="p-6">
              <ChartSkeleton height={400} />
            </CardContent>
          </Card>
        ) : (
          <>
            <SnapshotStrip overview={data} />

            <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterKey)}>
              <TabsList className="flex-wrap">
                <TabsTrigger value="all">All ({data.insights.length})</TabsTrigger>
                {(Object.keys(CATEGORY_LABEL) as InsightCategory[])
                  .filter((c) => filterCounts.has(c))
                  .map((c) => (
                    <TabsTrigger key={c} value={c}>
                      {CATEGORY_LABEL[c]} ({filterCounts.get(c)})
                    </TabsTrigger>
                  ))}
              </TabsList>
            </Tabs>

            <div className="grid gap-4 lg:grid-cols-2">
              {insights.map((i) => (
                <InsightCard key={i.id} insight={i} />
              ))}
              {insights.length === 0 && (
                <div className="col-span-full rounded-xl border border-dashed border-border bg-card/40 p-12 text-center text-sm text-muted-foreground">
                  No insights in this category right now — your portfolio looks healthy here.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function SnapshotStrip({ overview }: { overview: InsightsOverview }) {
  const { riskProfile, marketSnapshot } = overview;
  const sentimentTone =
    marketSnapshot.sentiment === "bullish"
      ? "bg-success/12 text-success"
      : marketSnapshot.sentiment === "cautious"
        ? "bg-warning/15 text-warning"
        : "bg-secondary text-foreground";
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="overflow-hidden shadow-card lg:col-span-2">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl gradient-brand text-primary-foreground shadow-glow">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Risk profile</p>
              <p className="mt-0.5 font-display text-xl font-bold">{riskProfile.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Score {riskProfile.score}/100 · drift +{riskProfile.drift.toFixed(1)}% from target
              </p>
            </div>
          </div>
          <div className="min-w-[200px] flex-1 space-y-2 sm:max-w-[280px]">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Equity allocation</span>
              <span className="font-semibold tabular-nums">
                {riskProfile.currentEquityPct.toFixed(0)}% / {riskProfile.targetEquityPct}%
              </span>
            </div>
            <Progress value={riskProfile.currentEquityPct} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Market today</p>
            <Badge variant="secondary" className={cn("border-0 capitalize", sentimentTone)}>
              {marketSnapshot.sentiment}
            </Badge>
          </div>
          <p className="text-sm font-semibold leading-snug">{marketSnapshot.headline}</p>
          <div className="grid grid-cols-3 gap-2 border-t border-border pt-3 text-xs">
            <Mini label="Nifty 50" value={formatPercent(marketSnapshot.nifty50Change)} positive={marketSnapshot.nifty50Change >= 0} />
            <Mini label="Sensex" value={formatPercent(marketSnapshot.sensexChange)} positive={marketSnapshot.sensexChange >= 0} />
            <Mini label="USD/INR" value={`₹${marketSnapshot.inrUsd.toFixed(2)}`} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Mini({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-0.5 font-semibold tabular-nums",
          positive === true && "text-success",
          positive === false && "text-destructive",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  const Icon = CATEGORY_ICON[insight.category];
  const tone = SEVERITY_TONE[insight.severity];
  return (
    <Card className={cn("relative overflow-hidden shadow-card transition-shadow hover:shadow-elegant", "border", tone.ring)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-foreground">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary" className={cn("h-5 border-0 px-1.5 text-[10px] uppercase", tone.chip)}>
                  {tone.label}
                </Badge>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {CATEGORY_LABEL[insight.category]}
                </span>
              </div>
              <CardTitle className="mt-1 text-base leading-snug">{insight.title}</CardTitle>
            </div>
          </div>
          {insight.potentialImpact && (
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Impact</p>
              <p className="font-display text-sm font-bold text-success">{insight.potentialImpact}</p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-6 pb-5">
        <CardDescription className="text-sm leading-relaxed text-muted-foreground">{insight.body}</CardDescription>

        <div className="rounded-lg border border-border bg-secondary/30 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Why we're suggesting this</p>
          <ul className="mt-2 space-y-1.5">
            {insight.reasoning.map((r) => (
              <li key={r} className="flex items-start gap-2 text-xs">
                <CircleDot className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Sparkles className="h-3 w-3 text-accent" />
            Confidence
            <span className="font-semibold text-foreground">{insight.confidence}%</span>
          </div>
          {insight.actions.length > 0 && (
            <div className="flex gap-1.5">
              {insight.actions.map((a) =>
                a.to ? (
                  <Button
                    key={a.label}
                    asChild
                    size="sm"
                    variant={a.variant === "primary" ? "default" : "outline"}
                    className="h-8 gap-1 text-xs"
                  >
                    <Link to={a.to}>
                      {a.label} <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                ) : (
                  <Button
                    key={a.label}
                    size="sm"
                    variant={a.variant === "primary" ? "default" : "outline"}
                    className="h-8 text-xs"
                    onClick={() => toast.info(a.label, { description: "Action coming soon." })}
                  >
                    {a.label}
                  </Button>
                ),
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
