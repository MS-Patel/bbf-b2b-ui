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

export type BranchStatus = "active" | "inactive";

export interface Branch {
  id: string;
  code: string;
  name: string;
  city: string;
  state: string;
  manager: string;
  rmCount: number;
  distributorCount: number;
  status: BranchStatus;
  updatedAt: string;
}

export type MasterUploadType = "schemes" | "navs";
export type MasterUploadStatus = "processed" | "processing" | "failed";

export interface MasterUploadRun {
  id: string;
  type: MasterUploadType;
  fileName: string;
  uploadedBy: string;
  uploadedAt: string;
  records: number;
  errors: number;
  status: MasterUploadStatus;
}

export interface AMCMaster {
  id: string;
  code: string;
  name: string;
  registrar: "CAMS" | "Karvy" | "KFintech";
  activeSchemes: number;
  lastNavAt: string;
  status: "active" | "paused";
}

export type PartnerStatus = "active" | "pending" | "suspended";
export type MappingStatus = "active" | "pending" | "review";

export interface DistributorProfile {
  id: string;
  name: string;
  arn: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  branchId: string;
  branchName: string;
  rmOwnerId?: string;
  rmOwnerName?: string;
  clientCount: number;
  rmCount: number;
  aum: number;
  status: PartnerStatus;
  joinedAt: string;
  updatedAt: string;
}

export interface RmProfile {
  id: string;
  name: string;
  employeeCode: string;
  email: string;
  phone: string;
  branchId: string;
  branchName: string;
  distributorIds: string[];
  distributorNames: string[];
  clientCount: number;
  aum: number;
  status: PartnerStatus;
  joinedAt: string;
  updatedAt: string;
}

export interface InvestorDistributorMapping {
  id: string;
  investorName: string;
  investorEmail: string;
  distributorId: string;
  distributorName: string;
  rmId: string;
  rmName: string;
  branchId: string;
  branchName: string;
  status: MappingStatus;
  mappedAt: string;
}

export interface RmMapping {
  id: string;
  rmId: string;
  rmName: string;
  branchId: string;
  branchName: string;
  distributorIds: string[];
  distributorNames: string[];
  status: MappingStatus;
  updatedAt: string;
}
