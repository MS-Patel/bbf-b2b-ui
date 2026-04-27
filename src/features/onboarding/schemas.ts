import { z } from "zod";

export const inviteLeadSchema = z.object({
  // Identity
  fullName: z.string().min(2, "Enter full name"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(10, "Enter a valid phone").optional().or(z.literal("")),
  alternatePhone: z.string().optional().or(z.literal("")),
  pan: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Invalid PAN format")
    .optional()
    .or(z.literal("")),
  dob: z.string().optional().or(z.literal("")),

  // Address
  addressLine1: z.string().optional().or(z.literal("")),
  addressLine2: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  pincode: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),

  // Investment profile
  riskProfile: z.enum(["Conservative", "Moderate", "Aggressive"]).optional(),
  investmentHorizon: z.enum(["<1y", "1-3y", "3-5y", "5y+"]).optional(),

  // Source / assignment
  source: z.enum(["Referral", "Website", "Campaign", "RM Direct"]),
  assignedRm: z.string().optional(),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export type InviteLeadInput = z.infer<typeof inviteLeadSchema>;

export const rejectReasonSchema = z.object({
  reason: z.string().min(5, "Provide a brief reason"),
});
export type RejectReasonInput = z.infer<typeof rejectReasonSchema>;
