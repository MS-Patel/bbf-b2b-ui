import { useMemo } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Repeat2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChartSkeleton } from "@/components/feedback/skeletons";
import { StatusBadge, type StatusTone } from "@/components/feedback/status-badge";

import { useHoldingsQuery } from "@/features/portfolio/api";
import { useTransactionsQuery } from "@/features/transactions/api";
import { useAuthStore } from "@/stores/auth-store";
import { useImpersonationStore } from "@/features/impersonation/store";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { formatCompactINR, formatDate, formatINR, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Holding } from "@/types/portfolio";
import type { Transaction, TransactionStatus, TransactionType } from "@/types/transaction";

export const Route = createFileRoute("/app/investor/portfolio/$holdingId")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    const impersonating = useImpersonationStore.getState().client;
    if (!impersonating && user) throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "Holding details — Read-only" }] }),
  component: HoldingDetailPage,
  notFoundComponent: () => (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-lg font-semibold">Holding not found</p>
      <Button asChild variant="outline">
        <Link to="/app/investor/portfolio">Back to portfolio</Link>
      </Button>
    </div>
  ),
});

const STATUS_TONE: Record<TransactionStatus, StatusTone> = {
  completed: "success",
  pending: "warning",
  processing: "info",
  failed: "destructive",
};
const STATUS_LABEL: Record<TransactionStatus, string> = {
  completed: "Completed",
  pending: "Pending",
  processing: "Processing",
  failed: "Failed",
};
const TYPE_LABEL: Record<TransactionType, string> = {
  purchase: "Purchase",
  sip: "SIP",
  redeem: "Redeem",
  switch_in: "Switch In",
  switch_out: "Switch Out",
  dividend: "Dividend",
};

function HoldingDetailPage() {
  const { holdingId } = Route.useParams();
  const { data: holdings, isLoading: holdingsLoading } = useHoldingsQuery();
  const { data: txns, isLoading: txnsLoading } = useTransactionsQuery();

  const holding = holdings?.find((h) => h.id === holdingId);
  const navHistory = useMemo(() => buildNavHistory(holding), [holding]);
  const relatedTxns = useMemo(() => {
    if (!txns || !holding) return [];
    return txns
      .filter((t) => t.schemeCode === holding.schemeCode)
      .sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [txns, holding]);

  if (!holdingsLoading && holdings && !holding) {
    return (
      <>
        <PageHeader eyebrow="Portfolio" title="Holding not found" description="This position may have been redeemed." />
        <div className="px-6 py-6 sm:px-8">
          <Button asChild variant="outline" className="gap-2">
            <Link to="/app/investor/portfolio">
              <ArrowLeft className="h-4 w-4" /> Back to portfolio
            </Link>
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Portfolio"
        title={holding?.schemeName ?? "Holding"}
        description={holding ? `${holding.amc} · ${holding.category}` : "Loading details…"}
        actions={
          holding ? (
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" className="gap-2">
                <Link to="/app/investor/portfolio">
                  <ArrowLeft className="h-4 w-4" /> Portfolio
                </Link>
              </Button>
            </div>
          ) : null
        }
      />

      <div className="space-y-6 px-6 py-6 sm:px-8">
        {holdingsLoading || !holding ? (
          <Card className="shadow-card">
            <CardContent className="p-6">
              <ChartSkeleton height={400} />
            </CardContent>
          </Card>
        ) : (
          <>
            <StatGrid holding={holding} />

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="shadow-card lg:col-span-2">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>NAV trend</CardTitle>
                      <CardDescription>Last 12 months · indicative chart.</CardDescription>
                    </div>
                    <Badge variant="secondary" className="border-0 bg-secondary text-foreground">
                      <CalendarDays className="mr-1 h-3 w-3" /> NAV as of {formatDate(holding.navAsOf)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-2 pb-4 sm:px-4">
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={navHistory} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="navFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="2 4" stroke="var(--color-border)" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(v) => new Date(v).toLocaleDateString("en-IN", { month: "short" })}
                        stroke="var(--color-muted-foreground)"
                        tickLine={false}
                        axisLine={false}
                        fontSize={11}
                        minTickGap={16}
                      />
                      <YAxis
                        domain={["dataMin - 5", "dataMax + 5"]}
                        tickFormatter={(v) => `₹${Number(v).toFixed(0)}`}
                        stroke="var(--color-muted-foreground)"
                        tickLine={false}
                        axisLine={false}
                        fontSize={11}
                        width={56}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "var(--color-popover)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        formatter={(value) => [`₹${Number(value).toFixed(2)}`, "NAV"]}
                        labelFormatter={(label) =>
                          new Date(label as string).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="nav"
                        stroke="var(--color-primary)"
                        strokeWidth={2.4}
                        fill="url(#navFill)"
                        activeDot={{ r: 4, strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Key facts</CardTitle>
                  <CardDescription>Snapshot of this holding.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Fact label="Scheme code" value={holding.schemeCode} mono />
                  <Fact label="Asset class" value={holding.assetClass} capitalize />
                  <Fact label="Category" value={holding.category} />
                  <Fact label="Units held" value={holding.units.toLocaleString("en-IN", { maximumFractionDigits: 3 })} />
                  <Fact label="Avg cost NAV" value={`₹${holding.avgNav.toFixed(2)}`} />
                  <Fact label="Current NAV" value={`₹${holding.currentNav.toFixed(2)}`} accent />
                  <Fact label="SIP active" value={holding.sip ? "Yes" : "No"} />
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Transactions in this scheme</CardTitle>
                <CardDescription>{relatedTxns.length} record(s) found.</CardDescription>
              </CardHeader>
              <CardContent className="px-0 pb-4">
                {txnsLoading ? (
                  <div className="px-6">
                    <ChartSkeleton height={200} />
                  </div>
                ) : relatedTxns.length === 0 ? (
                  <p className="px-6 py-8 text-center text-sm text-muted-foreground">No transactions yet for this scheme.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-y border-border bg-secondary/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                          <th className="px-6 py-2">Date</th>
                          <th className="px-6 py-2">Type</th>
                          <th className="px-6 py-2 text-right">Amount</th>
                          <th className="px-6 py-2 text-right">Units</th>
                          <th className="px-6 py-2 text-right">NAV</th>
                          <th className="px-6 py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {relatedTxns.slice(0, 12).map((t) => (
                          <TxnRow key={t.id} txn={t} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
}

function StatGrid({ holding }: { holding: Holding }) {
  const positive = holding.unrealizedGain >= 0;
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <StatCard label="Current value" value={formatCompactINR(holding.currentValue)} accent />
      <StatCard label="Invested" value={formatCompactINR(holding.invested)} />
      <StatCard
        label="Gain"
        value={`${positive ? "+" : ""}${formatINR(Math.abs(holding.unrealizedGain))}`}
        tone={positive ? "success" : "destructive"}
        icon={positive ? TrendingUp : TrendingDown}
      />
      <StatCard
        label="Returns / XIRR"
        value={`${formatPercent(holding.returnPct)} · ${formatPercent(holding.xirr)}`}
        tone={positive ? "success" : "destructive"}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  accent?: boolean;
  tone?: "success" | "destructive";
  icon?: typeof TrendingUp;
}) {
  return (
    <Card className="shadow-card">
      <CardContent className="p-5">
        {Icon && (
          <div
            className={cn(
              "grid h-9 w-9 place-items-center rounded-xl",
              tone === "success" && "bg-success/12 text-success",
              tone === "destructive" && "bg-destructive/12 text-destructive",
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        )}
        <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p
          className={cn(
            "mt-1 font-semibold tabular-nums",
            accent && "font-display text-2xl font-bold",
            !accent && "font-display text-xl",
            tone === "success" && "text-success",
            tone === "destructive" && "text-destructive",
          )}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function Fact({
  label,
  value,
  mono,
  capitalize,
  accent,
}: {
  label: string;
  value: string;
  mono?: boolean;
  capitalize?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-sm font-semibold tabular-nums",
          mono && "font-mono",
          capitalize && "capitalize",
          accent && "text-primary",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function TxnRow({ txn }: { txn: Transaction }) {
  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/40">
      <td className="px-6 py-3 text-sm font-medium">{formatDate(txn.date)}</td>
      <td className="px-6 py-3 text-sm">{TYPE_LABEL[txn.type]}</td>
      <td className="px-6 py-3 text-right font-semibold tabular-nums">{formatINR(txn.amount)}</td>
      <td className="px-6 py-3 text-right tabular-nums text-muted-foreground">{txn.units.toFixed(3)}</td>
      <td className="px-6 py-3 text-right tabular-nums text-muted-foreground">₹{txn.nav.toFixed(2)}</td>
      <td className="px-6 py-3">
        <StatusBadge tone={STATUS_TONE[txn.status]} label={STATUS_LABEL[txn.status]} />
      </td>
    </tr>
  );
}

/**
 * Generate a deterministic pseudo NAV history for the last 12 months,
 * smoothly interpolating between avgNav and currentNav with mild noise.
 * Mock-only — real impl would call /portfolio/holdings/{id}/nav-history/.
 */
function buildNavHistory(holding?: Holding): Array<{ date: string; nav: number }> {
  if (!holding) return [];
  const months = 12;
  const result: Array<{ date: string; nav: number }> = [];
  const start = holding.avgNav;
  const end = holding.currentNav;
  const seed = holding.id.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  let r = seed;
  const today = new Date();
  for (let i = months; i >= 0; i--) {
    const t = (months - i) / months;
    // Smooth interpolation with sine-based noise
    r = (r * 9301 + 49297) % 233280;
    const noise = ((r / 233280) - 0.5) * (Math.abs(end - start) * 0.18 + 2);
    const nav = start + (end - start) * t + noise;
    const d = new Date(today);
    d.setMonth(d.getMonth() - i);
    result.push({ date: d.toISOString().slice(0, 10), nav: Math.max(nav, 1) });
  }
  return result;
}
