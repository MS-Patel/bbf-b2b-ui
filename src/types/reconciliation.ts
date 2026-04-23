export type RtaSource = "CAMS" | "KFINTECH";

export type ReconciliationStatus =
  | "queued"
  | "processing"
  | "matched"
  | "errors"
  | "completed";

export interface ReconciliationFile {
  id: string;
  source: RtaSource;
  fileName: string;
  uploadedAt: string;
  uploadedBy: string;
  status: ReconciliationStatus;
  totalRows: number;
  matchedRows: number;
  errorRows: number;
}

export type ReconciliationErrorSeverity = "low" | "medium" | "high";
export type ReconciliationErrorType =
  | "FOLIO_NOT_FOUND"
  | "AMOUNT_MISMATCH"
  | "UNIT_MISMATCH"
  | "NAV_MISSING"
  | "SCHEME_NOT_MAPPED"
  | "DUPLICATE_ROW";

export interface ReconciliationError {
  id: string;
  fileId: string;
  rowNumber: number;
  folio: string;
  scheme: string;
  errorType: ReconciliationErrorType;
  message: string;
  severity: ReconciliationErrorSeverity;
}
