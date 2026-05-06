export type ReportType =
  | "wealth"
  | "pl"
  | "capital_gains"
  | "transaction"
  | "holding";

export type ReportFormat = "pdf" | "excel" | "csv";

export type ReportStatus = "ready" | "processing" | "failed";

export interface ReportHistoryRow {
  id: string;
  clientName: string;
  type: ReportType;
  fromDate: string;
  toDate: string;
  format: ReportFormat;
  status: ReportStatus;
  generatedAt: string;
  generatedBy: string;
}

export const REPORT_TYPE_LABEL: Record<ReportType, string> = {
  wealth: "Wealth Report",
  pl: "P&L Report",
  capital_gains: "Capital Gains",
  transaction: "Transaction Statement",
  holding: "Holding Statement",
};

export const REPORT_TYPE_ENDPOINT: Record<ReportType, string> = {
  wealth: "ExportWealthReportView",
  pl: "ExportPLReportView",
  capital_gains: "ExportCapitalGainsReportView",
  transaction: "ExportTransactionStatementView",
  holding: "ExportHoldingStatementView",
};
