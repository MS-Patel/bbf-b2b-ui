import { useMemo, useState } from "react";
import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import {
  Briefcase,
  Calendar,
  Car,
  GraduationCap,
  Heart,
  Home,
  PiggyBank,
  Plane,
  Plus,
  ShieldCheck,
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
import { StatGridSkeleton, ChartSkeleton } from "@/components/feedback/skeletons";

import { useGoalsOverviewQuery } from "@/features/goals/api";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { formatCompactINR, formatINR, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Goal, GoalCategory, GoalPriority, GoalStatus, GoalsSummary } from "@/types/goals";

export const Route = createFileRoute("/app/investor/goals")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "investor") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "Goals — BuyBestFin" }] }),
  component: GoalsPage,
});

const CATEGORY_ICON: Record<GoalCategory, typeof Target> = {
  retirement: ShieldCheck,
  house: Home,
  education: GraduationCap,
  vehicle: Car,
  travel: Plane,
  wedding: Heart,
  emergency: PiggyBank,
  wealth: Briefcase,
};

const STATUS_LABEL: Record<GoalStatus, string> = {
  on_track: "On track",
  at_risk: "At risk",
  behind: "Behind",
  achieved: "Achieved",
};

const STATUS_TONE: Record<GoalStatus, string> = {
  on_track: "bg-success/12 text-success",
  at_risk: "bg-warning/15 text-warning",
  behind: "bg-destructive/12 text-destructive",
  achieved: "bg-primary/15 text-primary",
};

const PRIORITY_TONE: Record<GoalPriority, string> = {
  high: "border-destructive/30 text-destructive",
  medium: "border-warning/30 text-warning",
  low: "border-border text-muted-foreground",
};

type FilterKey = "all" | GoalStatus;

function GoalsPage() {
  const { data, isLoading } = useGoalsOverviewQuery();
  const [filter, setFilter] = useState<FilterKey>("all");

  const goals = useMemo(() => {
    if (!data) return [];
    return filter === "all" ? data.goals : data.goals.filter((g) => g.status === filter);
  }, [data, filter]);

  return (
    <>
      <PageHeader
        eyebrow="Plan"
        title="Your financial goals"
        description="Map every SIP and holding to a life goal — and see exactly how close you are."
        actions={
          <Button
            className="gap-2"
            onClick={() => toast.info("Goal wizard", { description: "Multi-step goal creation coming soon." })}
          >
            <Plus className="h-4 w-4" /> New goal
          </Button>
        }
      />

      <div className="space-y-6 px-6 py-6 sm:px-8">
        {isLoading || !data ? (
          <>
            <StatGridSkeleton />
            <Card className="shadow-card">
              <CardContent className="p-6">
                <ChartSkeleton height={420} />
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <SummaryStrip summary={data.summary} />

            <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterKey)}>
              <TabsList>
                <TabsTrigger value="all">All ({data.goals.length})</TabsTrigger>
                <TabsTrigger value="on_track">On track</TabsTrigger>
                <TabsTrigger value="at_risk">At risk</TabsTrigger>
                <TabsTrigger value="behind">Behind</TabsTrigger>
                <TabsTrigger value="achieved">Achieved</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="grid gap-4 lg:grid-cols-2">
              {goals.map((g) => (
                <GoalCard key={g.id} goal={g} />
              ))}
              {goals.length === 0 && (
                <div className="col-span-full rounded-xl border border-dashed border-border bg-card/40 p-12 text-center text-sm text-muted-foreground">
                  No goals match this filter.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function SummaryStrip({ summary }: { summary: GoalsSummary }) {
  const overallProgress = summary.totalTarget > 0 ? (summary.totalSaved / summary.totalTarget) * 100 : 0;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="shadow-card xl:col-span-2">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Overall progress</p>
              <p className="mt-1 font-display text-2xl font-bold tabular-nums">
                {formatCompactINR(summary.totalSaved)}{" "}
                <span className="text-base font-medium text-muted-foreground">/ {formatCompactINR(summary.totalTarget)}</span>
              </p>
            </div>
            <Badge variant="secondary" className="border-0 bg-primary/10 text-primary">
              {overallProgress.toFixed(1)}%
            </Badge>
          </div>
          <Progress value={overallProgress} className="mt-4 h-2" />
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="p-5">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-foreground">
            <TrendingUp className="h-4 w-4" />
          </div>
          <p className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Monthly outflow</p>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums">{formatCompactINR(summary.monthlyOutflow)}</p>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="p-5">
          <div className="grid h-10 w-10 place-items-center rounded-xl gradient-accent text-accent-foreground shadow-glow">
            <Target className="h-4 w-4" />
          </div>
          <p className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</p>
          <p className="mt-1 text-sm font-semibold">
            <span className="text-success">{summary.onTrackCount} on track</span>
            <span className="px-1.5 text-border">·</span>
            <span className="text-destructive">{summary.atRiskCount} need attention</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function GoalCard({ goal }: { goal: Goal }) {
  const Icon = CATEGORY_ICON[goal.category];
  const progress = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
  const monthsLeft = Math.max(
    Math.round((+new Date(goal.targetDate) - Date.now()) / (30 * 86400_000)),
    0,
  );
  const projected = projectFutureValue(
    goal.currentAmount,
    goal.monthlyContribution,
    goal.expectedReturnPct,
    monthsLeft,
  );
  const projectedPct = goal.targetAmount > 0 ? (projected / goal.targetAmount) * 100 : 0;

  return (
    <Card className="shadow-card transition-shadow hover:shadow-elegant">
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl gradient-brand text-primary-foreground shadow-glow">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">{goal.name}</CardTitle>
              <Badge variant="outline" className={cn("h-5 border px-1.5 text-[10px] uppercase", PRIORITY_TONE[goal.priority])}>
                {goal.priority}
              </Badge>
            </div>
            <CardDescription className="mt-0.5 flex items-center gap-2 text-xs">
              <Calendar className="h-3 w-3" />
              Target {formatDate(goal.targetDate)} · {monthsLeft} mo left
            </CardDescription>
          </div>
        </div>
        <span className={cn("inline-flex shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold", STATUS_TONE[goal.status])}>
          {STATUS_LABEL[goal.status]}
        </span>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <div className="flex items-baseline justify-between">
            <span className="font-display text-xl font-bold tabular-nums">
              {formatCompactINR(goal.currentAmount)}
            </span>
            <span className="text-xs text-muted-foreground">
              of <span className="font-semibold text-foreground">{formatCompactINR(goal.targetAmount)}</span>
            </span>
          </div>
          <Progress value={progress} className="mt-2 h-2" />
          <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
            <span>{progress.toFixed(1)}% saved</span>
            <span>
              Projected: {formatCompactINR(projected)} ({projectedPct.toFixed(0)}%)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 rounded-lg bg-secondary/40 p-3 text-xs">
          <Stat label="SIP / mo" value={goal.monthlyContribution > 0 ? formatINR(goal.monthlyContribution) : "—"} />
          <Stat label="Expected return" value={`${goal.expectedReturnPct}%`} />
          <Stat label="Linked funds" value={`${goal.linkedHoldings.length}`} />
        </div>

        {goal.linkedHoldings.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Linked holdings</p>
            {goal.linkedHoldings.slice(0, 3).map((h) => (
              <div key={h.holdingId} className="flex items-center justify-between text-xs">
                <span className="truncate font-medium">{h.schemeName}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">{formatCompactINR(h.currentValue)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-semibold tabular-nums">{value}</p>
    </div>
  );
}

/** Future value of (current corpus + monthly SIP) at annual return for N months. */
function projectFutureValue(current: number, monthlySip: number, annualPct: number, months: number): number {
  if (months <= 0) return current;
  const r = annualPct / 100 / 12;
  const fvCurrent = current * Math.pow(1 + r, months);
  const fvSip = monthlySip > 0 && r > 0 ? monthlySip * ((Math.pow(1 + r, months) - 1) / r) : monthlySip * months;
  return Math.round(fvCurrent + fvSip);
}
