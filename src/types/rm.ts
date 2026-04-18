import type { KycStatusLite } from "@/types/admin";

export interface ClientLite {
  id: string;
  fullName: string;
  email: string;
  phoneMasked: string;
  kycStatus: KycStatusLite;
  aum: number;
  sipMonthly: number;
  lastOrderAt: string;
  riskProfile: "Conservative" | "Moderate" | "Aggressive";
  joinedAt: string;
}

export type LeadStage = "lead" | "kyc_started" | "kyc_in_review" | "verified" | "first_invest";

export interface OnboardingLead {
  id: string;
  fullName: string;
  email: string;
  stage: LeadStage;
  source: "Referral" | "Website" | "Campaign" | "RM Direct";
  createdAt: string;
  updatedAt: string;
}

export interface RmEarnings {
  mtdCommission: number;
  ytdCommission: number;
  pendingPayout: number;
  aumServiced: number;
  monthly: Array<{ month: string; commission: number; aum: number }>;
}
