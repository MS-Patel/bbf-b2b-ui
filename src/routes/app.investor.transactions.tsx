import { useMemo, useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Download, Filter, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableSkeleton } from "@/components/feedback/skeletons";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { StatusBadge, type StatusTone } from "@/components/feedback/status-badge";
import { useTransactionsQuery } from "@/features/transactions/api";
import { useAuthStore } from "@/stores/auth-store";
import { useImpersonationStore } from "@/features/impersonation/store";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { formatDate, formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Transaction, TransactionStatus, TransactionType } from "@/types/transaction";

export const Route = createFileRoute("/app/investor/transactions")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    const impersonating = useImpersonationStore.getState().client;
    if (!impersonating && user) throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "Transactions — Read-only" }] }),
  component: TransactionsPage,
});

const TYPE_LABEL: Record<TransactionType, string> = {
  purchase: "Purchase",
  sip: "SIP",
  redeem: "Redeem",
  switch_in: "Switch In",
  switch_out: "Switch Out",
  dividend: "Dividend",
};

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

const TYPE_TONE: Record<TransactionType, string> = {
  purchase: "bg-info/12 text-info",
  sip: "bg-primary/10 text-primary",
  redeem: "bg-warning/15 text-warning dark:text-warning",
  switch_in: "bg-success/12 text-success",
  switch_out: "bg-secondary text-secondary-foreground",
  dividend: "bg-accent/15 text-accent",
};

function TransactionsPage() {
  const { data, isLoading } = useTransactionsQuery();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"all" | TransactionType>("all");
  const [status, setStatus] = useState<"all" | TransactionStatus>("all");
  const [range, setRange] = useState<"all" | "30d" | "90d" | "1y">("all");

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    const now = Date.now();
    const cutoff =
      range === "30d"
        ? now - 30 * 86400_000
        : range === "90d"
          ? now - 90 * 86400_000
          : range === "1y"
            ? now - 365 * 86400_000
            : 0;
    return data.filter((t) => {
      if (q && !(t.schemeName.toLowerCase().includes(q) || t.amc.toLowerCase().includes(q) || t.orderId.toLowerCase().includes(q))) return false;
      if (type !== "all" && t.type !== type) return false;
      if (status !== "all" && t.status !== status) return false;
      if (cutoff && +new Date(t.date) < cutoff) return false;
      return true;
    });
  }, [data, query, type, status, range]);

  const columns: DataTableColumn<Transaction>[] = [
    {
      id: "date",
      header: "Date",
      sortValue: (r) => +new Date(r.date),
      accessor: (r) => <span className="text-sm font-medium">{formatDate(r.date)}</span>,
    },
    {
      id: "scheme",
      header: "Scheme",
      sortValue: (r) => r.schemeName,
      accessor: (r) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{r.schemeName}</p>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {r.amc} · Folio {r.folio}
          </p>
        </div>
      ),
    },
    {
      id: "type",
      header: "Type",
      accessor: (r) => (
        <span className={cn("inline-flex rounded-md px-2 py-0.5 text-xs font-semibold", TYPE_TONE[r.type])}>
          {TYPE_LABEL[r.type]}
        </span>
      ),
    },
    {
      id: "amount",
      header: "Amount",
      align: "right",
      sortValue: (r) => r.amount,
      accessor: (r) => <span className="font-semibold">{formatINR(r.amount)}</span>,
    },
    {
      id: "units",
      header: "Units",
      align: "right",
      sortValue: (r) => r.units,
      accessor: (r) => <span className="text-muted-foreground">{r.units.toFixed(3)}</span>,
    },
    {
      id: "nav",
      header: "NAV",
      align: "right",
      sortValue: (r) => r.nav,
      accessor: (r) => <span className="text-muted-foreground">₹{r.nav.toFixed(2)}</span>,
    },
    {
      id: "status",
      header: "Status",
      accessor: (r) => <StatusBadge tone={STATUS_TONE[r.status]} label={STATUS_LABEL[r.status]} />,
    },
  ];

  function handleExport() {
    toast.success("Export queued", {
      description: `${filtered.length} transactions will be emailed as CSV shortly.`,
    });
  }

  return (
    <>
      <PageHeader
        eyebrow="History"
        title="Transactions"
        description="Every order, SIP installment, redemption, switch and dividend in one searchable ledger."
        actions={
          <Button variant="outline" className="gap-2" onClick={handleExport} disabled={!data?.length}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      <div className="space-y-6 px-6 py-6 sm:px-8">
        <Card className="shadow-card">
          <CardContent className="space-y-4 p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search scheme, AMC, or order ID…"
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={range} onValueChange={(v) => setRange(v as typeof range)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All time</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="1y">Last 12 months</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {(Object.keys(TYPE_LABEL) as TransactionType[]).map((t) => (
                      <SelectItem key={t} value={t}>
                        {TYPE_LABEL[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {(Object.keys(STATUS_LABEL) as TransactionStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {(query || type !== "all" || status !== "all" || range !== "all") && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Filter className="h-3 w-3" />
                <span>{filtered.length} of {data?.length ?? 0} transactions match your filters.</span>
              </div>
            )}
          </CardContent>
        </Card>

        {isLoading ? (
          <Card className="shadow-card">
            <CardContent className="p-5">
              <TableSkeleton rows={8} cols={7} />
            </CardContent>
          </Card>
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            initialSortId="date"
            initialSortDir="desc"
            pageSize={12}
            mobileCard={(r) => (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{r.schemeName}</p>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      {formatDate(r.date)} · {r.amc}
                    </p>
                  </div>
                  <StatusBadge tone={STATUS_TONE[r.status]} label={STATUS_LABEL[r.status]} />
                </div>
                <div className="grid grid-cols-3 gap-2 rounded-lg bg-secondary/40 p-3 text-xs">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Type</p>
                    <p className="mt-0.5 font-semibold">{TYPE_LABEL[r.type]}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Amount</p>
                    <p className="mt-0.5 font-semibold tabular-nums">{formatINR(r.amount)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">NAV</p>
                    <p className="mt-0.5 font-semibold tabular-nums">₹{r.nav.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}
          />
        )}
      </div>
    </>
  );
}
