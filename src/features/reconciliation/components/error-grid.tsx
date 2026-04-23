import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { StatusBadge, type StatusTone } from "@/components/feedback/status-badge";
import type { ReconciliationError, ReconciliationErrorSeverity } from "@/types/reconciliation";

const SEV_TONE: Record<ReconciliationErrorSeverity, StatusTone> = {
  low: "muted",
  medium: "warning",
  high: "destructive",
};

const TYPE_LABEL: Record<string, string> = {
  AMOUNT_MISMATCH: "Amount mismatch",
  FOLIO_NOT_FOUND: "Folio not found",
  UNIT_MISMATCH: "Unit mismatch",
  NAV_MISSING: "NAV missing",
  SCHEME_NOT_MAPPED: "Scheme not mapped",
  DUPLICATE_ROW: "Duplicate row",
};

interface ErrorGridProps {
  errors: ReconciliationError[];
}

export function ErrorGrid({ errors }: ErrorGridProps) {
  const columns: DataTableColumn<ReconciliationError>[] = [
    {
      id: "row",
      header: "Row",
      align: "right",
      sortValue: (r) => r.rowNumber,
      accessor: (r) => <span className="font-mono text-xs">{r.rowNumber}</span>,
    },
    {
      id: "folio",
      header: "Folio",
      sortValue: (r) => r.folio,
      accessor: (r) => <span className="font-mono text-xs">{r.folio}</span>,
    },
    {
      id: "scheme",
      header: "Scheme",
      sortValue: (r) => r.scheme,
      accessor: (r) => <span className="text-sm">{r.scheme}</span>,
    },
    {
      id: "type",
      header: "Error",
      sortValue: (r) => r.errorType,
      accessor: (r) => <span className="text-sm font-medium">{TYPE_LABEL[r.errorType] ?? r.errorType}</span>,
    },
    {
      id: "message",
      header: "Detail",
      accessor: (r) => <span className="text-xs text-muted-foreground">{r.message}</span>,
    },
    {
      id: "severity",
      header: "Severity",
      sortValue: (r) => r.severity,
      accessor: (r) => <StatusBadge tone={SEV_TONE[r.severity]} label={r.severity} />,
    },
  ];

  if (errors.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/40 p-12 text-center text-sm text-muted-foreground">
        No errors in this file. All rows reconciled successfully.
      </div>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={errors}
      initialSortId="row"
      initialSortDir="asc"
      pageSize={10}
      mobileCard={(r) => (
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-semibold">{TYPE_LABEL[r.errorType] ?? r.errorType}</p>
            <StatusBadge tone={SEV_TONE[r.severity]} label={r.severity} />
          </div>
          <p className="text-xs text-muted-foreground">{r.message}</p>
          <p className="font-mono text-[11px] text-muted-foreground">
            Row {r.rowNumber} · Folio {r.folio}
          </p>
          <p className="text-xs">{r.scheme}</p>
        </div>
      )}
    />
  );
}
