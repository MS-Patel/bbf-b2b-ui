export type UserRole = "investor" | "admin" | "rm" | "distributor";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  kycStatus?: "pending" | "verified" | "rejected" | "not_started";
  phone?: string;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  role: UserRole;
}

export interface OtpLoginPayload {
  identifier: string;
  otp: string;
  role: UserRole;
}

export interface ForgotPasswordPayload {
  email: string;
}
