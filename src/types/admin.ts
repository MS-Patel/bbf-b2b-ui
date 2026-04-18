import type { UserRole } from "@/types/auth";

export type PlatformUserStatus = "active" | "suspended" | "invited";
export type KycStatusLite = "verified" | "pending" | "rejected" | "not_started";

export interface PlatformUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  kycStatus: KycStatusLite;
  status: PlatformUserStatus;
  joinedAt: string;
  lastActiveAt: string;
  aum?: number;
}

export type IntegrationName = "BSE Star MF" | "NDML KYC" | "CAMS RTA" | "Karvy RTA";
export type IntegrationStatus = "operational" | "degraded" | "down";

export interface IntegrationHealth {
  name: IntegrationName;
  status: IntegrationStatus;
  uptime: number; // percent
  latencyMs: number;
  lastCheck: string;
}

export interface IntegrationLog {
  id: string;
  integration: IntegrationName;
  level: "info" | "warn" | "error";
  message: string;
  at: string;
}

export type PayoutStatus = "pending" | "processed" | "failed" | "scheduled";

export interface PayoutRun {
  id: string;
  cycle: string; // e.g. "Mar 2026"
  beneficiary: string;
  beneficiaryRole: "rm" | "distributor";
  amount: number;
  status: PayoutStatus;
  createdAt: string;
  processedAt?: string;
}

export interface CommissionRow {
  id: string;
  payee: string;
  payeeRole: "rm" | "distributor";
  schemeCategory: string;
  aum: number;
  trailRate: number; // %
  earned: number;
  cycle: string;
}

export interface AdminOverviewStats {
  totalAum: number;
  activeInvestors: number;
  ordersToday: number;
  kycPending: number;
  ordersTrend: Array<{ date: string; orders: number }>;
  aumByAsset: Array<{ name: string; value: number }>;
}
