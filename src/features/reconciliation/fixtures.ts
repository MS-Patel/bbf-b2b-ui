import type { ReconciliationError, ReconciliationFile } from "@/types/reconciliation";

export const RECONCILIATION_FILES: ReconciliationFile[] = [
  {
    id: "rec_001",
    source: "CAMS",
    fileName: "CAMS_MAILBACK_20260418.txt",
    uploadedAt: "2026-04-18T09:32:00Z",
    uploadedBy: "Vikram Mehta",
    status: "completed",
    totalRows: 1842,
    matchedRows: 1842,
    errorRows: 0,
  },
  {
    id: "rec_002",
    source: "KFINTECH",
    fileName: "KFIN_MB_20260419.csv",
    uploadedAt: "2026-04-19T08:14:00Z",
    uploadedBy: "Vikram Mehta",
    status: "errors",
    totalRows: 964,
    matchedRows: 921,
    errorRows: 43,
  },
  {
    id: "rec_003",
    source: "CAMS",
    fileName: "CAMS_MAILBACK_20260420.txt",
    uploadedAt: "2026-04-20T10:01:00Z",
    uploadedBy: "Priya Nair",
    status: "matched",
    totalRows: 1571,
    matchedRows: 1571,
    errorRows: 0,
  },
  {
    id: "rec_004",
    source: "KFINTECH",
    fileName: "KFIN_MB_20260422.csv",
    uploadedAt: "2026-04-22T08:48:00Z",
    uploadedBy: "Vikram Mehta",
    status: "processing",
    totalRows: 1102,
    matchedRows: 0,
    errorRows: 0,
  },
];

const FOLIOS = ["10293847/01", "55382910/02", "44829100/01", "73829011/03", "20183746/01"];
const SCHEMES = [
  "Parag Parikh Flexi Cap Direct",
  "Mirae Asset Midcap Direct",
  "HDFC Corporate Bond Direct",
  "ICICI Pru Equity & Debt Direct",
  "SBI Gold ETF FoF",
];

export const RECONCILIATION_ERRORS: ReconciliationError[] = Array.from({ length: 43 }).map(
  (_, i) => {
    const types = [
      "AMOUNT_MISMATCH",
      "FOLIO_NOT_FOUND",
      "UNIT_MISMATCH",
      "NAV_MISSING",
      "SCHEME_NOT_MAPPED",
      "DUPLICATE_ROW",
    ] as const;
    const sev = (["low", "medium", "high"] as const)[i % 3];
    const errorType = types[i % types.length];
    return {
      id: `err_${i + 1}`,
      fileId: "rec_002",
      rowNumber: 12 + i * 7,
      folio: FOLIOS[i % FOLIOS.length],
      scheme: SCHEMES[i % SCHEMES.length],
      errorType,
      severity: sev,
      message: humanise(errorType),
    };
  },
);

function humanise(type: string): string {
  switch (type) {
    case "AMOUNT_MISMATCH":
      return "Order amount differs from RTA mailback by ≥ ₹1.";
    case "FOLIO_NOT_FOUND":
      return "Folio not present in active investor records.";
    case "UNIT_MISMATCH":
      return "Allotted units differ from BSE Star MF confirmation.";
    case "NAV_MISSING":
      return "NAV for transaction date missing in master.";
    case "SCHEME_NOT_MAPPED":
      return "Scheme code not mapped to internal identifier.";
    case "DUPLICATE_ROW":
      return "Duplicate of a previously imported transaction.";
    default:
      return "Unrecognised error.";
  }
}
