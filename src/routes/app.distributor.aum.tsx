import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { StatusBadge, type StatusTone } from "@/components/feedback/status-badge";
import { useDistributorOverviewQuery, useSubBrokersQuery } from "@/features/distributor/api";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { formatCompactINR, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SubBroker } from "@/types/distributor";

export const Route = createFileRoute("/app/distributor/aum")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "distributor") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "AUM — Distributor" }] }),
  component: DistributorAumPage,
});

const STATUS_TONE: Record<SubBroker["status"], StatusTone> = {
  active: "success",
  review: "warning",
  inactive: "muted",
};

function DistributorAumPage() {
  const { data: overview } = useDistributorOverviewQuery();
  const { data: brokers } = useSubBrokersQuery();

  const columns: DataTableColumn<SubBroker>[] = [
    { id: "name", header: "Sub-broker", sortValue: (r) => r.name, accessor: (r) => <span className="font-semibold">{r.name}</span> },
    { id: "rms", header: "RMs", align: "right", sortValue: (r) => r.rmCount, accessor: (r) => r.rmCount },
    { id: "clients", header: "Clients", align: "right", sortValue: (r) => r.clientCount, accessor: (r) => r.clientCount.toLocaleString("en-IN") },
    { id: "aum", header: "AUM", align: "right", sortValue: (r) => r.aum, accessor: (r) => <span className="font-semibold">{formatCompactINR(r.aum)}</span> },
    {
      id: "growth", header: "QTD", align: "right", sortValue: (r) => r.qtdGrowthPct,
      accessor: (r) => <span className={cn("font-semibold tabular-nums", r.qtdGrowthPct >= 0 ? "text-profit" : "text-loss")}>{formatPercent(r.qtdGrowthPct)}</span>,
    },
    { id: "status", header: "Status", sortValue: (r) => r.status, accessor: (r) => <StatusBadge tone={STATUS_TONE[r.status]} label={r.status} /> },
  ];

  return (
    <>
      <PageHeader eyebrow="Distributor · Network" title="AUM & sub-brokers" description="Hierarchy view of every sub-broker in your distribution network." />
      <div className="space-y-6 px-6 py-6 sm:px-8">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>AUM growth</CardTitle>
            <CardDescription>6-month rolling AUM across the network.</CardDescription>
          </CardHeader>
          <CardContent className="px-2 pb-4 sm:px-4">
            {overview && (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={overview.aumTrend} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="distAumFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.32} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--color-muted-foreground)" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis tickFormatter={(v) => formatCompactINR(Number(v))} stroke="var(--color-muted-foreground)" tickLine={false} axisLine={false} fontSize={11} width={68} />
                  <Tooltip formatter={(v) => formatCompactINR(Number(v))} contentStyle={{ borderRadius: 8, background: "var(--color-popover)", border: "1px solid var(--color-border)" }} />
                  <Area type="monotone" dataKey="aum" stroke="var(--color-primary)" strokeWidth={2.4} fill="url(#distAumFill)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <DataTable
          columns={columns}
          data={brokers ?? []}
          initialSortId="aum"
          initialSortDir="desc"
          pageSize={10}
          mobileCard={(r) => (
            <div className="space-y-1.5">
              <div className="flex items-start justify-between">
                <p className="font-semibold">{r.name}</p>
                <StatusBadge tone={STATUS_TONE[r.status]} label={r.status} />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">AUM · {r.clientCount} clients</span>
                <span className="font-semibold tabular-nums">{formatCompactINR(r.aum)}</span>
              </div>
              <p className={cn("text-xs font-semibold tabular-nums", r.qtdGrowthPct >= 0 ? "text-profit" : "text-loss")}>{formatPercent(r.qtdGrowthPct)} QTD</p>
            </div>
          )}
        />
      </div>
    </>
  );
}
