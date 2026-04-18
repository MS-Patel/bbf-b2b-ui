import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Eye } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { StatusBadge, type StatusTone } from "@/components/feedback/status-badge";
import { useRmClientsQuery } from "@/features/rm/api";
import { useImpersonationStore } from "@/features/impersonation/store";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { formatCompactINR, formatDate, formatINR } from "@/lib/format";
import type { ClientLite } from "@/types/rm";
import type { KycStatusLite } from "@/types/admin";

export const Route = createFileRoute("/app/rm/clients")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "rm") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "Client roster — RM" }] }),
  component: RmClientsPage,
});

const KYC_TONE: Record<KycStatusLite, StatusTone> = {
  verified: "success",
  pending: "warning",
  rejected: "destructive",
  not_started: "muted",
};

function RmClientsPage() {
  const { data, isLoading } = useRmClientsQuery();
  const navigate = useNavigate();
  const startImpersonation = useImpersonationStore((s) => s.start);
  const [search, setSearch] = useState("");
  const [kyc, setKyc] = useState<KycStatusLite | "all">("all");

  const rows = (data ?? []).filter((c) => {
    if (kyc !== "all" && c.kycStatus !== kyc) return false;
    if (search && !`${c.fullName} ${c.email}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function viewAs(client: ClientLite) {
    startImpersonation(client);
    void navigate({ to: "/app/investor" });
  }

  const columns: DataTableColumn<ClientLite>[] = [
    {
      id: "name", header: "Client", sortValue: (r) => r.fullName,
      accessor: (r) => (
        <div>
          <p className="font-semibold">{r.fullName}</p>
          <p className="text-xs text-muted-foreground">{r.email}</p>
        </div>
      ),
    },
    { id: "kyc", header: "KYC", sortValue: (r) => r.kycStatus, accessor: (r) => <StatusBadge tone={KYC_TONE[r.kycStatus]} label={r.kycStatus.replace("_", " ")} /> },
    { id: "risk", header: "Risk", sortValue: (r) => r.riskProfile, accessor: (r) => <span className="text-sm">{r.riskProfile}</span> },
    { id: "aum", header: "AUM", align: "right", sortValue: (r) => r.aum, accessor: (r) => <span className="font-semibold">{formatCompactINR(r.aum)}</span> },
    { id: "sip", header: "SIP", align: "right", sortValue: (r) => r.sipMonthly, accessor: (r) => r.sipMonthly > 0 ? formatINR(r.sipMonthly) : <span className="text-muted-foreground">—</span> },
    { id: "last", header: "Last order", sortValue: (r) => r.lastOrderAt, accessor: (r) => <span className="text-sm text-muted-foreground">{formatDate(r.lastOrderAt)}</span> },
    {
      id: "actions", header: "", align: "right",
      accessor: (r) => (
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => viewAs(r)}>
          <Eye className="h-3.5 w-3.5" /> View as
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="RM · Clients"
        title="Client roster"
        description={`Service ${data?.length ?? 0} assigned investors. Click "View as" to step into a client's portfolio.`}
      />
      <div className="space-y-5 px-6 py-6 sm:px-8">
        <Card className="shadow-card">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clients…" className="pl-9" />
            </div>
            <Select value={kyc} onValueChange={(v) => setKyc(v as KycStatusLite | "all")}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="KYC" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All KYC</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="not_started">Not started</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {isLoading ? (
          <Card className="shadow-card"><CardContent className="p-10 text-center text-sm text-muted-foreground">Loading clients…</CardContent></Card>
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            initialSortId="aum"
            initialSortDir="desc"
            pageSize={10}
            mobileCard={(r) => (
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{r.fullName}</p>
                    <p className="truncate text-xs text-muted-foreground">{r.email}</p>
                  </div>
                  <StatusBadge tone={KYC_TONE[r.kycStatus]} label={r.kycStatus.replace("_", " ")} />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">AUM</span>
                  <span className="font-semibold tabular-nums">{formatCompactINR(r.aum)}</span>
                </div>
                <Button size="sm" variant="outline" className="w-full gap-1.5" onClick={() => viewAs(r)}>
                  <Eye className="h-3.5 w-3.5" /> View as client
                </Button>
              </div>
            )}
          />
        )}
      </div>
    </>
  );
}
