import type { UserRole } from "@/types/auth";

export type LeadStage = "lead" | "kyc_started" | "kyc_in_review" | "verified" | "first_invest";

export type LeadSource = "Referral" | "Website" | "Campaign" | "RM Direct";

export type KycItemKey = "pan" | "aadhaar" | "bank" | "nominee" | "fatca" | "esign";

export type KycItemStatus = "pending" | "submitted" | "verified" | "rejected";

export type OwnerRole = Extract<UserRole, "rm" | "distributor" | "admin">;

export type KycChecklist = Record<KycItemKey, KycItemStatus>;

export interface OnboardingLead {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  pan?: string;
  stage: LeadStage;
  source: LeadSource;
  ownerId: string;
  ownerRole: OwnerRole;
  ownerName: string;
  assignedRm?: string;
  notes?: string;
  kycChecklist: KycChecklist;
  rejectionReason?: string;
  inviteSentAt?: string;
  inviteLink?: string;
  createdAt: string;
  updatedAt: string;
  history: Array<{ at: string; stage: LeadStage; note?: string }>;
}

export const KYC_ITEM_LABELS: Record<KycItemKey, string> = {
  pan: "PAN",
  aadhaar: "Aadhaar",
  bank: "Bank account",
  nominee: "Nominee",
  fatca: "FATCA declaration",
  esign: "e-Sign",
};

export const STAGE_LABELS: Record<LeadStage, string> = {
  lead: "New lead",
  kyc_started: "KYC started",
  kyc_in_review: "KYC review",
  verified: "Verified",
  first_invest: "First invest",
};
