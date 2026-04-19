export type OrderType = "lumpsum" | "sip" | "redeem" | "switch";
export type FolioMode = "new" | "existing";
export type SipFrequency = "monthly" | "quarterly";
export type RedeemMode = "amount" | "units" | "all";

export interface LumpsumOrderRequest {
  schemeId: string;
  amount: number;
  bankAccountId: string;
  folioMode: FolioMode;
  folioNumber?: string;
}

export interface SipOrderRequest {
  schemeId: string;
  monthlyAmount: number;
  frequency: SipFrequency;
  startDate: string; // ISO
  tenureMonths: number | null; // null => perpetual
  bankAccountId: string;
  folioMode: FolioMode;
  folioNumber?: string;
  stepUpPct?: number;
}

export interface RedeemOrderRequest {
  holdingId: string;
  mode: RedeemMode;
  amount?: number;
  units?: number;
  bankAccountId: string;
}

export interface SwitchOrderRequest {
  fromHoldingId: string;
  toSchemeId: string;
  mode: RedeemMode;
  amount?: number;
  units?: number;
  folioMode: FolioMode;
  folioNumber?: string;
}

export interface OrderConfirmation {
  orderId: string;
  bseOrderRef: string;
  status: "accepted" | "rejected";
  orderType: OrderType;
  primaryAmount: number; // amount for lumpsum/sip-monthly/redeem; switch=> from-side amount
  schemeName: string;
  toSchemeName?: string;
  estimatedNavDate: string;
  createdAt: string;
  /** SIP-only: NACH mandate reference. */
  mandateRef?: string;
  /** SIP-only: first debit date. */
  firstDebitDate?: string;
  /** Redeem-only: ETA credit date (T+3 for equity). */
  creditEtaDate?: string;
  /** Redeem-only: estimated proceeds. */
  estimatedProceeds?: number;
  /** Switch/redeem: units transacted. */
  units?: number;
}
