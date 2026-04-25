import type { UserRole } from "@/types/auth";

export type OrderType = "lump_sum" | "sip" | "switch" | "redeem";

export type OrderStatus =
  | "draft"
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export type SipFrequency = "monthly" | "quarterly";

export type PlacedByRole = Extract<UserRole, "admin" | "rm" | "distributor">;

export type RiskBand = "Low" | "Moderate" | "High" | "Very High";

export type SchemeCategory =
  | "Equity – Large Cap"
  | "Equity – Mid Cap"
  | "Equity – Small Cap"
  | "Equity – Flexi Cap"
  | "Hybrid"
  | "Debt – Liquid"
  | "Debt – Corporate Bond"
  | "Gold"
  | "International";

export interface SchemeLite {
  code: string;
  name: string;
  amc: string;
  category: SchemeCategory;
  latestNav: number;
  navAsOf: string;
  riskBand: RiskBand;
  exitLoadDays: number;
  /** Cut-off time in 24h HH:mm. */
  cutoff: string;
  minLumpSum: number;
  minSip: number;
}

export interface MandateLite {
  id: string;
  clientId: string;
  umrn: string;
  bank: string;
  maxAmount: number;
  status: "active" | "pending" | "expired";
}

export interface Order {
  id: string;
  clientId: string;
  clientName: string;
  type: OrderType;
  status: OrderStatus;
  schemeCode: string;
  schemeName: string;
  amc: string;
  /** For lump-sum / SIP / redeem-by-amount. */
  amount?: number;
  units?: number;
  nav?: number;
  folio?: string;
  // SIP
  sipFrequency?: SipFrequency;
  sipDate?: number;
  sipTenureMonths?: number | "perpetual";
  mandateId?: string;
  firstDebitOn?: string;
  // Switch
  switchTargetCode?: string;
  switchTargetName?: string;
  // Redeem
  redeemAll?: boolean;
  payoutBank?: string;
  // Audit
  placedById: string;
  placedByName: string;
  placedByRole: PlacedByRole;
  placedAt: string;
  settledAt?: string;
  failureReason?: string;
  reference?: string;
  consent: {
    investorConsent: boolean;
    riskAck: boolean;
    cutoffAck: boolean;
  };
}

export const ORDER_TYPE_LABEL: Record<OrderType, string> = {
  lump_sum: "Lump-sum",
  sip: "SIP",
  switch: "Switch",
  redeem: "Redeem",
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  draft: "Draft",
  pending: "Pending",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
};
