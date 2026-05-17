import type { KycStatusLite } from "@/types/admin";

export type InvestorStatus = "active" | "dormant" | "suspended" | "onboarding";
export type FatcaStatus = "declared" | "pending" | "exempt";
export type NomineeStatus = "registered" | "missing" | "rejected";
export type RiskProfile = "Conservative" | "Moderate" | "Aggressive";

export interface InvestorBank {
  bankName: string;
  accountMasked: string;
  ifsc: string;
  primary: boolean;
  verifiedAt?: string;
}

export interface InvestorNominee {
  id: string;
  name: string;
  relation: string;
  sharePct: number;
  dob?: string;
}

export interface InvestorDocument {
  id: string;
  type: "PAN" | "Aadhaar" | "Bank Proof" | "Address Proof" | "Cancelled Cheque" | "FATCA" | "Signature";
  fileName: string;
  status: "verified" | "pending" | "rejected";
  uploadedAt: string;
}

export interface InvestorRelationship {
  id: string;
  name: string;
  role: "RM" | "Distributor" | "Family Head" | "Spouse" | "Child" | "Parent";
  meta?: string;
  since?: string;
}

export interface InvestorTxnLite {
  id: string;
  date: string;
  scheme: string;
  type: "Purchase" | "Redemption" | "Switch" | "SIP";
  amount: number;
  units: number;
  status: "settled" | "pending" | "failed";
}

export interface InvestorSIP {
  id: string;
  scheme: string;
  amount: number;
  frequency: "Monthly" | "Quarterly";
  nextDebit: string;
  status: "active" | "paused" | "stopped";
}

export interface InvestorAuditEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  field?: string;
  before?: string;
  after?: string;
}

export interface Investor {
  id: string;
  folioNo: string;
  pan: string;
  fullName: string;
  email: string;
  phoneMasked: string;
  status: InvestorStatus;
  kycStatus: KycStatusLite;
  fatca: FatcaStatus;
  nomineeStatus: NomineeStatus;
  riskProfile: RiskProfile;
  aum: number;
  sipMonthly: number;
  joinedAt: string;
  lastOrderAt: string;
  city: string;
  state: string;
  // owner
  rmName: string;
  distributorName: string;
  familyGroup?: string;
  // detail
  dob: string;
  address: string;
  banks: InvestorBank[];
  nominees: InvestorNominee[];
  documents: InvestorDocument[];
  relationships: InvestorRelationship[];
  transactions: InvestorTxnLite[];
  sips: InvestorSIP[];
  audit: InvestorAuditEntry[];
}
