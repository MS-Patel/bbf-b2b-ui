import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, HandCoins, Layers, RefreshCw, Wallet, Hourglass } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { StatusBadge, type StatusTone } from "@/components/feedback/status-badge";
import {
  useDistributorCategoriesQuery,
  usePayoutCycleSummariesQuery,
  usePayoutsQuery,
} from "@/features/admin/api";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { formatCompactINR, formatDate, formatINR } from "@/lib/format";
import type { PayoutRun, PayoutStatus } from "@/types/admin";

export const Route = createFileRoute("/app/admin/payouts")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "admin") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "Payouts dashboard — Admin" }] }),
  component: AdminPayoutsPage,
});

const STATUS_TONE: Record<PayoutStatus, StatusTone> = {
  processed: "success",
  pending: "warning",
  scheduled: "info",
  failed: "destructive",
};

function AdminPayoutsPage() {
  const { data: payouts } = usePayoutsQuery();
  const { data: summaries } = usePayoutCycleSummariesQuery();
  const { data: categories } = useDistributorCategoriesQuery();

  const cycles = useMemo(() => (summaries ?? []).map((s) => s.cycle), [summaries]);
  const [cycle, setCycle] = useState<string>("Apr 2026");
  const [status, setStatus] = useState<PayoutStatus | "all">("all");

  const activeSummary = useMemo(
    () => (summaries ?? []).find((s) => s.cycle === cycle),
    [summaries, cycle],
  );

  const cyclePayouts = useMemo(
    () => (payouts ?? []).filter((p) => p.cycle === cycle),
    [payouts, cycle],
  );

  const pendingCount = useMemo(
    () => cyclePayouts.filter((p) => p.status === "pending" || p.status === "scheduled").length,
    [cyclePayouts],
  );

  const activeCategories = (categories ?? []).filter((c) => c.status === "active").length;

  const rows = useMemo(
    () => (payouts ?? []).filter((r) => (status === "all" || r.status === status)),
    [payouts, status],
  );

  const columns: DataTableColumn<PayoutRun>[] = [
    {
      id: "id",
      header: "Run ID",
      sortValue: (r) => r.id,
      accessor: (r) => <span className="font-mono text-xs">{r.id.toUpperCase()}</span>,
    },
    { id: "cycle", header: "Cycle", sortValue: (r) => r.cycle, accessor: (r) => r.cycle },
    {
      id: "ben",
      header: "Beneficiary",
      sortValue: (r) => r.beneficiary,
      accessor: (r) => (
        <div>
          <p className="font-semibold">{r.beneficiary}</p>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {r.beneficiaryRole === "rm" ? "RM" : "Distributor"}
          </p>
        </div>
      ),
    },
    {
      id: "amt",
      header: "Amount",
      align: "right",
      sortValue: (r) => r.amount,
      accessor: (r) => <span className="font-semibold">{formatINR(r.amount)}</span>,
    },
    {
      id: "status",
      header: "Status",
      sortValue: (r) => r.status,
      accessor: (r) => <StatusBadge tone={STATUS_TONE[r.status]} label={r.status} />,
    },
    {
      id: "created",
      header: "Created",
      sortValue: (r) => r.createdAt,
      accessor: (r) => <span className="text-sm text-muted-foreground">{formatDate(r.createdAt)}</span>,
    },
    {
      id: "processed",
      header: "Processed",
      sortValue: (r) => r.processedAt ?? "",
      accessor: (r) =>
        r.processedAt ? (
          <span className="text-sm text-muted-foreground">{formatDate(r.processedAt)}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Admin · Finance"
        title="Payouts dashboard"
        description="Track commissions paid to RMs and distributors, brokerage ingested from RTAs, and category-wise splits."
        actions={
          <>
            <Select value={cycle} onValueChange={setCycle}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cycles.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={() => toast("Triggered re-run for failed payouts")}
            >
              <RefreshCw className="h-4 w-4" /> Re-run failed
            </Button>
            <Button className="gap-1.5" onClick={() => toast.success("Payout report queued")}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </>
        }
      />

      <div className="space-y-6 px-6 py-6 sm:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            label="Total payouts"
            value={formatCompactINR(activeSummary?.totalPayouts ?? 0)}
            sub={`${cycle} cycle`}
            icon={Wallet}
          />
          <Stat
            label="Brokerage imported"
            value={formatCompactINR(activeSummary?.brokerageImported ?? 0)}
            sub={`${cycle} ingest`}
            icon={HandCoins}
          />
          <Stat
            label="Pending payouts"
            value={String(pendingCount)}
            sub="Awaiting processing"
            icon={Hourglass}
          />
          <Stat
            label="Distributor categories"
            value={String(activeCategories)}
            sub="Active slabs"
            icon={Layers}
          />
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Payouts vs brokerage trend</CardTitle>
            <CardDescription>Last 6 cycles · totals in ₹.</CardDescription>
          </CardHeader>
          <CardContent className="px-2 pb-4 sm:px-4">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={summaries ?? []} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="payoutFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="cycle"
                  stroke="var(--color-muted-foreground)"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                />
                <YAxis
                  tickFormatter={(v) => formatCompactINR(Number(v))}
                  stroke="var(--color-muted-foreground)"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  width={68}
                />
                <Tooltip
                  formatter={(v) => formatINR(Number(v))}
                  contentStyle={{
                    borderRadius: 8,
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area
                  type="monotone"
                  dataKey="totalPayouts"
                  name="Payouts"
                  stroke="var(--color-primary)"
                  strokeWidth={2.4}
                  fill="url(#payoutFill)"
                />
                <Line
                  type="monotone"
                  dataKey="brokerageImported"
                  name="Brokerage"
                  stroke="var(--color-info)"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Category split — {cycle}</CardTitle>
            <CardDescription>Payout distribution across distributor tiers.</CardDescription>
          </CardHeader>
          <CardContent className="px-2 pb-4 sm:px-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={activeSummary?.byCategory ?? []}
                layout="vertical"
                margin={{ top: 6, right: 16, left: 16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="2 4" stroke="var(--color-border)" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(v) => formatCompactINR(Number(v))}
                  stroke="var(--color-muted-foreground)"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                />
                <YAxis
                  type="category"
                  dataKey="category"
                  stroke="var(--color-muted-foreground)"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  width={80}
                />
                <Tooltip
                  formatter={(v) => formatINR(Number(v))}
                  contentStyle={{
                    borderRadius: 8,
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                  }}
                />
                <Bar dataKey="amount" fill="var(--color-primary)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Payout runs</CardTitle>
              <CardDescription>All beneficiary payouts across cycles.</CardDescription>
            </div>
            <Select value={status} onValueChange={(v) => setStatus(v as PayoutStatus | "all")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="processed">Processed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={rows}
              initialSortId="created"
              initialSortDir="desc"
              pageSize={10}
              mobileCard={(r) => (
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{r.beneficiary}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.cycle} · {r.beneficiaryRole === "rm" ? "RM" : "Distributor"}
                      </p>
                    </div>
                    <StatusBadge tone={STATUS_TONE[r.status]} label={r.status} />
                  </div>
                  <p className="font-semibold tabular-nums">{formatINR(r.amount)}</p>
                </div>
              )}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: typeof Wallet;
}) {
  return (
    <Card className="shadow-card">
      <CardContent className="p-5">
        <div className="grid h-10 w-10 place-items-center rounded-xl gradient-brand text-primary-foreground shadow-glow">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <p className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 font-display text-2xl font-bold tabular-nums">{value}</p>
        {sub ? <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p> : null}
      </CardContent>
    </Card>
  );
}
