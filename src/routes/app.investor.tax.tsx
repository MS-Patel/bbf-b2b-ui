import { useMemo, useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { AlertTriangle, Calculator, Info, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartSkeleton, StatGridSkeleton } from "@/components/feedback/skeletons";

import { simulateHarvest, useTaxOverviewQuery } from "@/features/tax/api";
import { useAuthStore } from "@/stores/auth-store";
import { useImpersonationStore } from "@/features/impersonation/store";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { formatCompactINR, formatDate, formatINR, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { GainTerm, TaxBucket, TaxLot, TaxOverview } from "@/types/tax";

export const Route = createFileRoute("/app/investor/tax")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    const impersonating = useImpersonationStore.getState().client;
    if (!impersonating && user) throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "Tax view — Read-only" }] }),
  component: TaxPage,
});

function TaxPage() {
  const { data, isLoading } = useTaxOverviewQuery();
  const [selected, setSelected] = useState<string[]>([]);
  const [termFilter, setTermFilter] = useState<"all" | GainTerm>("all");

  const lots = useMemo(() => {
    if (!data) return [];
    return termFilter === "all" ? data.lots : data.lots.filter((l) => l.term === termFilter);
  }, [data, termFilter]);

  const simulation = useMemo(() => {
    if (!data) return null;
    return simulateHarvest(data.lots, selected);
  }, [data, selected]);

  function toggleLot(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function applyHarvest() {
    if (!simulation || simulation.selectedLots.length === 0) {
      toast.error("Select at least one lot to harvest.");
      return;
    }
    toast.success("Harvest plan saved", {
      description: `${simulation.selectedLots.length} lot(s) flagged · ${formatINR(simulation.netProceeds)} proceeds`,
    });
  }

  return (
    <>
      <PageHeader
        eyebrow="Plan"
        title="Tax Harvesting"
        description="Optimize STCG, LTCG, and the ₹1L equity exemption — simulate before you sell."
      />

      <div className="space-y-6 px-6 py-6 sm:px-8">
        {isLoading || !data ? (
          <>
            <StatGridSkeleton />
            <Card className="shadow-card">
              <CardContent className="p-6">
                <ChartSkeleton height={400} />
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <FYHeader overview={data} />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <BucketCard term="short" bucket={data.shortTerm} />
              <BucketCard term="long" bucket={data.longTerm} ltcgExempt={data.ltcgEquityExemption} />
            </div>

            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-primary" /> What-if simulator
                    </CardTitle>
                    <CardDescription>
                      Pick lots to sell and see exactly how much tax you'd owe — or save.
                    </CardDescription>
                  </div>
                  <Tabs value={termFilter} onValueChange={(v) => setTermFilter(v as typeof termFilter)}>
                    <TabsList>
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="short">Short</TabsTrigger>
                      <TabsTrigger value="long">Long</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 px-6 pb-6">
                <Tabs defaultValue="lots">
                  <TabsList>
                    <TabsTrigger value="lots">Lots ({lots.length})</TabsTrigger>
                    <TabsTrigger value="impact">Tax impact</TabsTrigger>
                  </TabsList>
                  <TabsContent value="lots" className="mt-4">
                    <div className="overflow-hidden rounded-xl border border-border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-secondary/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                            <th className="w-10 px-3 py-2"></th>
                            <th className="px-3 py-2">Scheme</th>
                            <th className="px-3 py-2">Acquired</th>
                            <th className="px-3 py-2 text-right">Cost</th>
                            <th className="px-3 py-2 text-right">Current</th>
                            <th className="px-3 py-2 text-right">Gain</th>
                            <th className="px-3 py-2 text-center">Term</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lots.map((lot) => {
                            const checked = selected.includes(lot.id);
                            return (
                              <tr
                                key={lot.id}
                                className={cn(
                                  "cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-muted/40",
                                  checked && "bg-primary/5",
                                )}
                                onClick={() => toggleLot(lot.id)}
                              >
                                <td className="px-3 py-3">
                                  <Checkbox checked={checked} onCheckedChange={() => toggleLot(lot.id)} />
                                </td>
                                <td className="px-3 py-3">
                                  <p className="truncate font-semibold">{lot.schemeName}</p>
                                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                                    {lot.amc} · {lot.assetClass}
                                  </p>
                                </td>
                                <td className="px-3 py-3 text-xs text-muted-foreground">
                                  {formatDate(lot.acquiredOn)}
                                  <br />
                                  <span className="text-[10px]">{lot.daysHeld} days</span>
                                </td>
                                <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">{formatINR(lot.costBasis)}</td>
                                <td className="px-3 py-3 text-right font-semibold tabular-nums">{formatINR(lot.currentValue)}</td>
                                <td
                                  className={cn(
                                    "px-3 py-3 text-right font-semibold tabular-nums",
                                    lot.gain >= 0 ? "text-profit" : "text-loss",
                                  )}
                                >
                                  {lot.gain >= 0 ? "+" : ""}
                                  {formatINR(Math.abs(lot.gain))}
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <Badge
                                    variant="secondary"
                                    className={cn(
                                      "border-0 text-[10px] uppercase",
                                      lot.term === "long" ? "bg-success/12 text-success" : "bg-warning/15 text-warning",
                                    )}
                                  >
                                    {lot.term === "long" ? "LTCG" : "STCG"}
                                  </Badge>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                  <TabsContent value="impact" className="mt-4">
                    {simulation && simulation.selectedLots.length > 0 ? (
                      <SimulationCard
                        result={simulation}
                        carryForward={data.carryForwardLoss}
                        ltcgExempt={data.ltcgEquityExemption}
                      />
                    ) : (
                      <div className="rounded-xl border border-dashed border-border bg-card/40 p-12 text-center text-sm text-muted-foreground">
                        Select one or more lots to see simulated tax impact.
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                {selected.length > 0 && simulation && (
                  <div className="flex flex-col items-stretch justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center">
                    <div className="text-sm">
                      <p className="font-semibold">
                        {simulation.selectedLots.length} lot(s) selected · proceeds{" "}
                        <span className="text-foreground">{formatINR(simulation.netProceeds)}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Estimated tax:{" "}
                        <span className="font-semibold text-foreground">
                          {formatINR(simulation.shortTaxImpact + simulation.longTaxImpact)}
                        </span>
                        {simulation.netTaxSaved > 0 && (
                          <>
                            {" "}
                            · saved <span className="font-semibold text-success">{formatINR(simulation.netTaxSaved)}</span> vs naive
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setSelected([])}>
                        Clear
                      </Button>
                      <Button onClick={applyHarvest} className="gap-2">
                        <Sparkles className="h-4 w-4" /> Save plan
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex items-start gap-3 rounded-lg border border-info/20 bg-info/5 p-4">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" />
              <p className="text-xs text-muted-foreground">
                Simulations are based on FY 2025-26 tax rules: equity STCG @20%, equity LTCG @12.5% above ₹1L
                exemption, debt taxed at slab. Consult your CA before final actions.
              </p>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function FYHeader({ overview }: { overview: TaxOverview }) {
  const totalLiability = overview.shortTerm.estimatedLiability + overview.longTerm.estimatedLiability;
  return (
    <Card className="overflow-hidden shadow-card">
      <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl gradient-brand text-primary-foreground shadow-glow">
            <Calculator className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold">{overview.financialYear}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              As of {formatDate(overview.asOf)} · carry-forward loss{" "}
              <span className="font-semibold text-foreground">{formatINR(overview.carryForwardLoss)}</span>
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Estimated FY liability</p>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums">{formatINR(totalLiability)}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function BucketCard({
  term,
  bucket,
  ltcgExempt,
}: {
  term: GainTerm;
  bucket: TaxBucket;
  ltcgExempt?: number;
}) {
  const isLong = term === "long";
  const Icon = isLong ? TrendingUp : TrendingDown;
  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Icon className={cn("h-4 w-4", isLong ? "text-success" : "text-warning")} />
              {isLong ? "Long-term capital gains" : "Short-term capital gains"}
            </CardTitle>
            <CardDescription className="mt-1">
              Effective rate {bucket.effectiveRatePct}% {isLong && ltcgExempt && `· ₹${(ltcgExempt / 1000).toFixed(0)}k exempt`}
            </CardDescription>
          </div>
          {isLong && bucket.exemptionAvailable !== undefined && bucket.exemptionAvailable > 0 && (
            <Badge variant="secondary" className="border-0 bg-success/12 text-success">
              {formatCompactINR(bucket.exemptionAvailable)} unused
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <Metric label="Realized" value={formatINR(bucket.realizedGain)} />
          <Metric label="Unrealized" value={formatINR(bucket.unrealizedGain)} />
          <Metric label="Liability" value={formatINR(bucket.estimatedLiability)} accent />
        </div>
        {isLong && ltcgExempt && (
          <div>
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>Exemption used</span>
              <span>
                {formatPercent((bucket.realizedGain / ltcgExempt) * 100, 0)}
              </span>
            </div>
            <Progress value={Math.min((bucket.realizedGain / ltcgExempt) * 100, 100)} className="mt-1 h-1.5" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-1 font-semibold tabular-nums", accent && "font-display text-lg")}>{value}</p>
    </div>
  );
}

function SimulationCard({
  result,
  carryForward,
  ltcgExempt,
}: {
  result: ReturnType<typeof simulateHarvest>;
  carryForward: number;
  ltcgExempt: number;
}) {
  const totalTax = result.shortTaxImpact + result.longTaxImpact;
  const exemptionPct = (result.exemptionUsed / ltcgExempt) * 100;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBox label="Net proceeds" value={formatCompactINR(result.netProceeds)} accent />
        <StatBox label="STCG realized" value={formatINR(result.realizedShortGain)} />
        <StatBox label="LTCG realized" value={formatINR(result.realizedLongGain)} />
        <StatBox label="Tax due" value={formatINR(totalTax)} tone={totalTax > 0 ? "warn" : "success"} />
      </div>

      <div className="space-y-2 rounded-xl border border-border bg-secondary/30 p-4">
        <Row label="STCG @ 20%" value={formatINR(result.shortTaxImpact)} />
        <Row label="LTCG taxable (after exemption)" value={formatINR(Math.max(result.realizedLongGain - result.exemptionUsed, 0))} />
        <Row label="LTCG @ 12.5%" value={formatINR(result.longTaxImpact)} />
        <Row
          label="Exemption used"
          value={`${formatINR(result.exemptionUsed)} of ₹${(ltcgExempt / 1000).toFixed(0)}k`}
          progress={exemptionPct}
        />
        {carryForward > 0 && (
          <div className="flex items-center justify-between border-t border-border pt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Carry-forward loss available
            </span>
            <span className="font-semibold text-foreground">{formatINR(carryForward)}</span>
          </div>
        )}
      </div>

      {result.netTaxSaved > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-success/30 bg-success/5 p-4">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          <div className="text-xs">
            <p className="font-semibold text-foreground">
              Tax-optimized plan saves {formatINR(result.netTaxSaved)} vs treating these as short-term.
            </p>
            <p className="mt-0.5 text-muted-foreground">
              By harvesting long-term lots first, you capture the ₹1L exemption and lower-rate LTCG bracket.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({
  label,
  value,
  accent,
  tone,
}: {
  label: string;
  value: string;
  accent?: boolean;
  tone?: "warn" | "success";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        tone === "warn" && "border-warning/30 bg-warning/5",
        tone === "success" && "border-success/30 bg-success/5",
        !tone && "border-border bg-card",
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-1 font-semibold tabular-nums", accent && "font-display text-lg")}>{value}</p>
    </div>
  );
}

function Row({ label, value, progress }: { label: string; value: string; progress?: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">{value}</span>
      </div>
      {progress !== undefined && <Progress value={Math.min(progress, 100)} className="mt-1 h-1" />}
    </div>
  );
}
