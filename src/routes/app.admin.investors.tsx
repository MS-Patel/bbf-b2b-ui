import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Users, Wallet, ShieldCheck, AlertTriangle, Download, UserPlus, Eye, MoreHorizontal } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DataTable,
  type DataTableColumn,
  KPIWidget,
  FilterToolbar,
  SearchBar,
  StatusBadge,
  type StatusTone,
  BulkActionBar,
  EmptyState,
} from "@/components/admin";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { useInvestorsQuery } from "@/features/investors/api";
import type { Investor, InvestorStatus } from "@/features/investors/types";
import type { KycStatusLite } from "@/types/admin";
import { formatCompactINR, formatDate, formatINR } from "@/lib/format";

export const Route = createFileRoute("/app/admin/investors")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "admin") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "Investors — Admin" }] }),
  component: AdminInvestorsPage,
});

const KYC_TONE: Record<KycStatusLite, StatusTone> = {
  verified: "success",
  pending: "warning",
  rejected: "destructive",
  not_started: "muted",
};

const STATUS_TONE: Record<InvestorStatus, StatusTone> = {
  active: "success",
  onboarding: "info",
  dormant: "muted",
  suspended: "destructive",
};

function AdminInvestorsPage() {
  const { data, isLoading } = useInvestorsQuery();
  const investors = data ?? [];

  const [search, setSearch] = useState("");
  const [kyc, setKyc] = useState<KycStatusLite | "all">("all");
  const [status, setStatus] = useState<InvestorStatus | "all">("all");
  const [risk, setRisk] = useState<string>("all");
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = useMemo(() => {
    return investors.filter((i) => {
      if (kyc !== "all" && i.kycStatus !== kyc) return false;
      if (status !== "all" && i.status !== status) return false;
      if (risk !== "all" && i.riskProfile !== risk) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!`${i.fullName} ${i.email} ${i.pan} ${i.folioNo}`.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [investors, search, kyc, status, risk]);

  const activeFilters = [kyc, status, risk].filter((v) => v !== "all").length;

  const kpis = useMemo(() => {
    const total = investors.length;
    const aum = investors.reduce((s, i) => s + i.aum, 0);
    const kycPending = investors.filter((i) => i.kycStatus === "pending" || i.kycStatus === "not_started").length;
    const suspended = investors.filter((i) => i.status === "suspended").length;
    return { total, aum, kycPending, suspended };
  }, [investors]);

  const columns: DataTableColumn<Investor>[] = [
    {
      id: "name",
      header: "Investor",
      sortValue: (r) => r.fullName,
      accessor: (r) => (
        <Link
          to="/app/admin/investors/$investorId"
          params={{ investorId: r.id }}
          className="group block"
        >
          <p className="font-semibold group-hover:text-primary">{r.fullName}</p>
          <p className="text-xs text-muted-foreground">
            {r.pan} · Folio {r.folioNo}
          </p>
        </Link>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortValue: (r) => r.status,
      accessor: (r) => <StatusBadge tone={STATUS_TONE[r.status]} label={r.status} />,
    },
    {
      id: "kyc",
      header: "KYC",
      sortValue: (r) => r.kycStatus,
      accessor: (r) => <StatusBadge tone={KYC_TONE[r.kycStatus]} label={r.kycStatus.replace("_", " ")} />,
    },
    {
      id: "owner",
      header: "RM / Distributor",
      sortValue: (r) => r.rmName,
      accessor: (r) => (
        <div className="min-w-0">
          <p className="truncate text-sm">{r.rmName}</p>
          <p className="truncate text-xs text-muted-foreground">{r.distributorName}</p>
        </div>
      ),
    },
    {
      id: "aum",
      header: "AUM",
      align: "right",
      sortValue: (r) => r.aum,
      accessor: (r) => <span className="font-semibold">{formatCompactINR(r.aum)}</span>,
    },
    {
      id: "sip",
      header: "SIP",
      align: "right",
      sortValue: (r) => r.sipMonthly,
      accessor: (r) =>
        r.sipMonthly > 0 ? formatINR(r.sipMonthly) : <span className="text-muted-foreground">—</span>,
    },
    {
      id: "last",
      header: "Last order",
      sortValue: (r) => r.lastOrderAt,
      accessor: (r) => <span className="text-sm text-muted-foreground">{formatDate(r.lastOrderAt)}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Admin · Investors"
        title="Investor master"
        description={`${investors.length} investors across all RMs and distributors. Drill into a folio for KYC, banks, nominees and audit history.`}
        actions={
          <>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" /> New investor
            </Button>
          </>
        }
      />
      <div className="space-y-5 px-6 py-6 sm:px-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KPIWidget label="Total investors" value={kpis.total.toLocaleString("en-IN")} icon={Users} hint="across platform" />
          <KPIWidget label="Total AUM" value={formatCompactINR(kpis.aum)} icon={Wallet} delta={{ value: "+2.4%", direction: "up" }} hint="vs last month" />
          <KPIWidget label="KYC pending" value={kpis.kycPending} icon={ShieldCheck} delta={{ value: `${kpis.kycPending}`, direction: kpis.kycPending > 5 ? "up" : "flat", tone: "negative" }} hint="needs action" />
          <KPIWidget label="Suspended" value={kpis.suspended} icon={AlertTriangle} hint="compliance hold" />
        </div>

        <FilterToolbar
          search={<SearchBar value={search} onChange={setSearch} placeholder="Search name, PAN, folio or email…" />}
          activeCount={activeFilters}
          onReset={() => {
            setKyc("all");
            setStatus("all");
            setRisk("all");
          }}
          filters={
            <>
              <Select value={status} onValueChange={(v) => setStatus(v as InvestorStatus | "all")}>
                <SelectTrigger className="h-8 w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="dormant">Dormant</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Select value={kyc} onValueChange={(v) => setKyc(v as KycStatusLite | "all")}>
                <SelectTrigger className="h-8 w-[140px]"><SelectValue placeholder="KYC" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All KYC</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="not_started">Not started</SelectItem>
                </SelectContent>
              </Select>
              <Select value={risk} onValueChange={setRisk}>
                <SelectTrigger className="h-8 w-[150px]"><SelectValue placeholder="Risk" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All risk</SelectItem>
                  <SelectItem value="Conservative">Conservative</SelectItem>
                  <SelectItem value="Moderate">Moderate</SelectItem>
                  <SelectItem value="Aggressive">Aggressive</SelectItem>
                </SelectContent>
              </Select>
            </>
          }
        />

        {isLoading ? (
          <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
            Loading investors…
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No investors match these filters"
            description="Try adjusting your search or resetting filters."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setKyc("all");
                  setStatus("all");
                  setRisk("all");
                }}
              >
                Reset filters
              </Button>
            }
          />
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            initialSortId="aum"
            initialSortDir="desc"
            pageSize={10}
            selectable
            selectedIds={selected}
            onSelectionChange={setSelected}
            rowActions={(r) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/app/admin/investors/$investorId" params={{ investorId: r.id }} className="gap-2">
                      <Eye className="h-4 w-4" /> Open profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>Trigger KYC refresh</DropdownMenuItem>
                  <DropdownMenuItem>Reassign RM</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">Suspend</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            mobileCard={(r) => (
              <Link to="/app/admin/investors/$investorId" params={{ investorId: r.id }} className="block space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{r.fullName}</p>
                    <p className="truncate text-xs text-muted-foreground">{r.pan} · {r.folioNo}</p>
                  </div>
                  <StatusBadge tone={KYC_TONE[r.kycStatus]} label={r.kycStatus.replace("_", " ")} />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{r.rmName}</span>
                  <span className="font-semibold tabular-nums">{formatCompactINR(r.aum)}</span>
                </div>
              </Link>
            )}
          />
        )}

        <BulkActionBar
          selectedCount={selected.length}
          onClear={() => setSelected([])}
          itemLabel="investor"
          actions={
            <>
              <Button variant="outline" size="sm">Export selected</Button>
              <Button variant="outline" size="sm">Reassign RM</Button>
              <Button variant="outline" size="sm">Trigger KYC</Button>
              <Button variant="destructive" size="sm">Suspend</Button>
            </>
          }
        />
      </div>
    </>
  );
}
