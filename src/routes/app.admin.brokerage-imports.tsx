import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, FileSpreadsheet, MoreHorizontal, RefreshCw, Upload } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { StatusBadge, type StatusTone } from "@/components/feedback/status-badge";
import { useBrokerageImportsQuery } from "@/features/admin/api";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { formatCompactINR, formatDate } from "@/lib/format";
import type { BrokerageImport, BrokerageImportStatus, BrokerageSource } from "@/types/admin";

export const Route = createFileRoute("/app/admin/brokerage-imports")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "admin") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "Brokerage imports — Admin" }] }),
  component: BrokerageImportsPage,
});

const STATUS_TONE: Record<BrokerageImportStatus, StatusTone> = {
  processed: "success",
  processing: "info",
  failed: "destructive",
};

function BrokerageImportsPage() {
  const { data, isLoading } = useBrokerageImportsQuery();
  const [status, setStatus] = useState<BrokerageImportStatus | "all">("all");
  const [source, setSource] = useState<BrokerageSource | "all">("all");

  const rows = useMemo(
    () =>
      (data ?? []).filter(
        (r) =>
          (status === "all" || r.status === status) && (source === "all" || r.source === source),
      ),
    [data, status, source],
  );

  const columns: DataTableColumn<BrokerageImport>[] = [
    {
      id: "imported",
      header: "Import date",
      sortValue: (r) => r.importedAt,
      accessor: (r) => <span className="text-sm text-muted-foreground">{formatDate(r.importedAt)}</span>,
    },
    {
      id: "file",
      header: "File name",
      sortValue: (r) => r.fileName,
      accessor: (r) => (
        <div>
          <p className="font-mono text-xs">{r.fileName}</p>
          <p className="text-xs text-muted-foreground">By {r.uploadedBy}</p>
        </div>
      ),
    },
    {
      id: "source",
      header: "Source",
      sortValue: (r) => r.source,
      accessor: (r) => <StatusBadge tone="muted" label={r.source} dot={false} />,
    },
    {
      id: "records",
      header: "Records",
      align: "right",
      sortValue: (r) => r.records,
      accessor: (r) => r.records.toLocaleString("en-IN"),
    },
    {
      id: "errors",
      header: "Errors",
      align: "right",
      sortValue: (r) => r.errors,
      accessor: (r) =>
        r.errors > 0 ? (
          <span className="font-semibold text-destructive">{r.errors}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: "amount",
      header: "Brokerage",
      align: "right",
      sortValue: (r) => r.amount,
      accessor: (r) => <span className="font-semibold tabular-nums">{formatCompactINR(r.amount)}</span>,
    },
    {
      id: "status",
      header: "Status",
      sortValue: (r) => r.status,
      accessor: (r) => <StatusBadge tone={STATUS_TONE[r.status]} label={r.status} />,
    },
    {
      id: "actions",
      header: "",
      align: "right",
      accessor: (r) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => toast.success(`Reprocessing ${r.fileName}`)}>
              <RefreshCw className="mr-2 h-4 w-4" /> Reprocess
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.success(`Report queued for ${r.fileName}`)}>
              <Download className="mr-2 h-4 w-4" /> Export report
            </DropdownMenuItem>
            {r.errors > 0 ? (
              <DropdownMenuItem onClick={() => toast(`${r.errors} errors logged for ${r.fileName}`)}>
                <FileSpreadsheet className="mr-2 h-4 w-4" /> View errors
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Admin · Finance"
        title="Brokerage imports"
        description="History of brokerage files ingested from BSE, NSE and registrars. Reprocess or export reports per run."
        actions={
          <Button className="gap-1.5" onClick={() => toast.success("Brokerage upload dialog opened")}>
            <Upload className="h-4 w-4" /> Upload brokerage file
          </Button>
        }
      />
      <div className="space-y-5 px-6 py-6 sm:px-8">
        <Card className="shadow-card">
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <Select value={status} onValueChange={(v) => setStatus(v as BrokerageImportStatus | "all")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="processed">Processed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={source} onValueChange={(v) => setSource(v as BrokerageSource | "all")}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                <SelectItem value="BSE">BSE</SelectItem>
                <SelectItem value="NSE">NSE</SelectItem>
                <SelectItem value="CAMS">CAMS</SelectItem>
                <SelectItem value="Karvy">Karvy</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">{rows.length} imports</p>
          </CardContent>
        </Card>

        {isLoading ? (
          <Card className="shadow-card">
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              Loading brokerage imports…
            </CardContent>
          </Card>
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            initialSortId="imported"
            initialSortDir="desc"
            pageSize={12}
            mobileCard={(r) => (
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs">{r.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.source} · {formatDate(r.importedAt)}
                    </p>
                  </div>
                  <StatusBadge tone={STATUS_TONE[r.status]} label={r.status} />
                </div>
                <p className="font-semibold tabular-nums">{formatCompactINR(r.amount)}</p>
              </div>
            )}
          />
        )}
      </div>
    </>
  );
}
