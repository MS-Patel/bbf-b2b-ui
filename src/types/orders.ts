export type OrderMode = "lumpsum" | "sip";
export type FolioMode = "new" | "existing";

export interface LumpsumOrderRequest {
  schemeId: string;
  amount: number;
  bankAccountId: string;
  folioMode: FolioMode;
  folioNumber?: string;
}

export interface OrderConfirmation {
  orderId: string;
  bseOrderRef: string;
  status: "accepted" | "rejected";
  amount: number;
  schemeName: string;
  estimatedNavDate: string;
  createdAt: string;
}
