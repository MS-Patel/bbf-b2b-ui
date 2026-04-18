import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { StatusBadge, type StatusTone } from "@/components/feedback/status-badge";
import { usePayoutsQuery } from "@/features/admin/api";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { formatDate, formatINR } from "@/lib/format";
import type { PayoutRun, PayoutStatus } from "@/types/admin";

export const Route = createFileRoute("/app/distributor/commissions")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "distributor") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "Commissions — Distributor" }] }),
  component: DistributorCommissionsPage,
});

const STATUS_TONE: Record<PayoutStatus, StatusTone> = {
  processed: "success",
  pending: "warning",
  scheduled: "info",
  failed: "destructive",
};

function DistributorCommissionsPage() {
  const { data } = usePayoutsQuery();
  const [cycle, setCycle] = useState<string>("Apr 2026");
  const distOnly = (data ?? []).filter((p) => p.beneficiaryRole === "distributor" && p.cycle === cycle);

  const totals = distOnly.reduce((s, r) => s + r.amount, 0);

  const columns: DataTableColumn<PayoutRun>[] = [
    { id: "ben", header: "Distributor", sortValue: (r) => r.beneficiary, accessor: (r) => <span className="font-semibold">{r.beneficiary}</span> },
    { id: "amt", header: "Amount", align: "right", sortValue: (r) => r.amount, accessor: (r) => <span className="font-semibold tabular-nums">{formatINR(r.amount)}</span> },
    { id: "status", header: "Status", sortValue: (r) => r.status, accessor: (r) => <StatusBadge tone={STATUS_TONE[r.status]} label={r.status} /> },
    { id: "created", header: "Created", sortValue: (r) => r.createdAt, accessor: (r) => <span className="text-sm text-muted-foreground">{formatDate(r.createdAt)}</span> },
    { id: "processed", header: "Processed", sortValue: (r) => r.processedAt ?? "", accessor: (r) => r.processedAt ? <span className="text-sm text-muted-foreground">{formatDate(r.processedAt)}</span> : <span className="text-muted-foreground">—</span> },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Distributor · Finance"
        title="Commissions & payouts"
        description={`Cycle total: ${formatINR(totals)}.`}
        actions={
          <Button className="gap-1.5" onClick={() => toast.success("Statement sent to email")}>
            <Download className="h-4 w-4" /> Download statement
          </Button>
        }
      />
      <div className="space-y-5 px-6 py-6 sm:px-8">
        <Card className="shadow-card">
          <CardContent className="flex items-center gap-3 p-4">
            <Select value={cycle} onValueChange={setCycle}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Apr 2026">Apr 2026</SelectItem>
                <SelectItem value="Mar 2026">Mar 2026</SelectItem>
                <SelectItem value="Feb 2026">Feb 2026</SelectItem>
                <SelectItem value="Jan 2026">Jan 2026</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">{distOnly.length} runs</p>
          </CardContent>
        </Card>

        <DataTable
          columns={columns}
          data={distOnly}
          initialSortId="amt"
          initialSortDir="desc"
          pageSize={10}
          mobileCard={(r) => (
            <div className="space-y-1.5">
              <div className="flex items-start justify-between">
                <p className="font-semibold">{r.beneficiary}</p>
                <StatusBadge tone={STATUS_TONE[r.status]} label={r.status} />
              </div>
              <p className="font-semibold tabular-nums">{formatINR(r.amount)}</p>
            </div>
          )}
        />
      </div>
    </>
  );
}
