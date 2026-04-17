export type TransactionType = "purchase" | "sip" | "redeem" | "switch_in" | "switch_out" | "dividend";
export type TransactionStatus = "completed" | "pending" | "failed" | "processing";

export interface Transaction {
  id: string;
  date: string; // ISO
  type: TransactionType;
  status: TransactionStatus;
  schemeCode: string;
  schemeName: string;
  amc: string;
  folio: string;
  amount: number;
  units: number;
  nav: number;
  orderId: string;
}
