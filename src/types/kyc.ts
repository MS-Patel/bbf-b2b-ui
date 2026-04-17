export type KycStepStatus = "completed" | "in_progress" | "pending" | "failed";

export interface KycStep {
  id: string;
  label: string;
  description: string;
  status: KycStepStatus;
  completedAt?: string;
}

export type KycOverallStatus = "verified" | "in_review" | "pending" | "rejected" | "not_started";

export interface InvestorProfile {
  fullName: string;
  email: string;
  phone: string;
  dob: string; // ISO
  panMasked: string; // e.g. ABCDE****F
  aadhaarMasked: string; // e.g. XXXX-XXXX-1234
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumberMasked: string;
  ifsc: string;
  accountType: "savings" | "current";
  isPrimary: boolean;
  verified: boolean;
}

export interface Nominee {
  id: string;
  name: string;
  relation: string;
  dob: string;
  sharePct: number;
}

export interface KycOverview {
  status: KycOverallStatus;
  provider: "NDML" | "CAMS";
  lastUpdated: string;
  steps: KycStep[];
  profile: InvestorProfile;
  bankAccounts: BankAccount[];
  nominees: Nominee[];
}
