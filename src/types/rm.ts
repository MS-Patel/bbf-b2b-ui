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

export interface RmEarnings {
  mtdCommission: number;
  ytdCommission: number;
  pendingPayout: number;
  aumServiced: number;
  monthly: Array<{ month: string; commission: number; aum: number }>;
}

// Re-export onboarding types from the canonical module to avoid duplication.
export type { LeadStage, OnboardingLead } from "@/features/onboarding/types";
