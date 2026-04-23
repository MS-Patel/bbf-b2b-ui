import { z } from "zod";
import type { UserRole } from "@/types/auth";

export const ROLE_OPTIONS: ReadonlyArray<{ value: UserRole; label: string; description: string }> = [
  { value: "admin", label: "Admin", description: "Operate the platform" },
  { value: "rm", label: "Relationship Manager", description: "Service your client roster" },
  { value: "distributor", label: "Distributor", description: "Track AUM & commissions" },
] as const;

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
  role: z.enum(["admin", "rm", "distributor"]),
});

export const otpRequestSchema = z.object({
  identifier: z.string().min(6, "Enter your email or mobile number"),
  role: z.enum(["admin", "rm", "distributor"]),
});

export const otpVerifySchema = otpRequestSchema.extend({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type OtpRequestFormValues = z.infer<typeof otpRequestSchema>;
export type OtpVerifyFormValues = z.infer<typeof otpVerifySchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
