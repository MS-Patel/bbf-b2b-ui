import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { FileSpreadsheet, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { StatusBadge, type StatusTone } from "@/components/feedback/status-badge";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";
import {
  useReconciliationErrorsQuery,
  useReconciliationFilesQuery,
} from "@/features/reconciliation/api";
import { UploadWizard } from "@/features/reconciliation/components/upload-wizard";
import { ErrorGrid } from "@/features/reconciliation/components/error-grid";
import { formatDate } from "@/lib/format";
import type { ReconciliationFile, ReconciliationStatus } from "@/types/reconciliation";

export const Route = createFileRoute("/app/admin/reconciliation")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "admin") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "Reconciliation — Admin" }] }),
  component: ReconciliationPage,
});

const STATUS_TONE: Record<ReconciliationStatus, StatusTone> = {
  queued: "muted",
  processing: "info",
  matched: "success",
  errors: "destructive",
  completed: "success",
};

function ReconciliationPage() {
  const { data, isLoading } = useReconciliationFilesQuery();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const errorsQuery = useReconciliationErrorsQuery(activeFileId);

  const activeFile = data?.find((f) => f.id === activeFileId) ?? null;

  const columns: DataTableColumn<ReconciliationFile>[] = [
    {
      id: "file",
      header: "File",
      sortValue: (r) => r.fileName,
      accessor: (r) => (
        <div className="flex items-start gap-2">
          <FileSpreadsheet className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="truncate font-mono text-xs font-semibold">{r.fileName}</p>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{r.source}</p>
          </div>
        </div>
      ),
    },
    {
      id: "uploaded",
      header: "Uploaded",
      sortValue: (r) => +new Date(r.uploadedAt),
      accessor: (r) => (
        <div>
          <p className="text-sm">{formatDate(r.uploadedAt)}</p>
          <p className="text-[11px] text-muted-foreground">{r.uploadedBy}</p>
        </div>
      ),
    },
    {
      id: "rows",
      header: "Rows",
      align: "right",
      sortValue: (r) => r.totalRows,
      accessor: (r) => <span className="tabular-nums">{r.totalRows.toLocaleString("en-IN")}</span>,
    },
    {
      id: "matched",
      header: "Matched",
      align: "right",
      sortValue: (r) => r.matchedRows,
      accessor: (r) => (
        <span className="tabular-nums text-success">
          {r.matchedRows.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      id: "errors",
      header: "Errors",
      align: "right",
      sortValue: (r) => r.errorRows,
      accessor: (r) => (
        <span className={r.errorRows > 0 ? "tabular-nums font-semibold text-destructive" : "tabular-nums text-muted-foreground"}>
          {r.errorRows.toLocaleString("en-IN")}
        </span>
      ),
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
        <Button
          size="sm"
          variant="outline"
          onClick={() => setActiveFileId(r.id)}
          disabled={r.errorRows === 0 && r.status !== "completed"}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Admin · Reconciliation"
        title="RTA mailback reconciliation"
        description="Upload CAMS / KFinTech mailback files and resolve unmatched rows against active orders."
        actions={
          <Button className="gap-2" onClick={() => setWizardOpen(true)}>
            <Plus className="h-4 w-4" /> Upload file
          </Button>
        }
      />
      <div className="space-y-5 px-6 py-6 sm:px-8">
        {isLoading ? (
          <Card className="shadow-card">
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              Loading reconciliation files…
            </CardContent>
          </Card>
        ) : (
          <DataTable
            columns={columns}
            data={data ?? []}
            initialSortId="uploaded"
            initialSortDir="desc"
            pageSize={10}
            mobileCard={(r) => (
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-xs font-semibold">{r.fileName}</p>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      {r.source} · {formatDate(r.uploadedAt)}
                    </p>
                  </div>
                  <StatusBadge tone={STATUS_TONE[r.status]} label={r.status} />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {r.matchedRows.toLocaleString("en-IN")} / {r.totalRows.toLocaleString("en-IN")} matched
                  </span>
                  {r.errorRows > 0 && (
                    <span className="font-semibold text-destructive">
                      {r.errorRows} error(s)
                    </span>
                  )}
                </div>
                <Button size="sm" variant="outline" className="w-full" onClick={() => setActiveFileId(r.id)}>
                  View errors
                </Button>
              </div>
            )}
          />
        )}
      </div>

      <UploadWizard open={wizardOpen} onOpenChange={setWizardOpen} />

      <Sheet open={!!activeFileId} onOpenChange={(o) => !o && setActiveFileId(null)}>
        <SheetContent side="right" className="w-full sm:max-w-3xl">
          <SheetHeader>
            <SheetTitle className="font-mono text-sm">{activeFile?.fileName}</SheetTitle>
            <SheetDescription>
              {activeFile?.source} · uploaded {activeFile && formatDate(activeFile.uploadedAt)} ·{" "}
              {activeFile?.errorRows ?? 0} error row(s)
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            {errorsQuery.isLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Loading errors…</p>
            ) : (
              <ErrorGrid errors={errorsQuery.data ?? []} />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
