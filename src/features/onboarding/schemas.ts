import { z } from "zod";

export const inviteLeadSchema = z.object({
  fullName: z.string().min(2, "Enter full name"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(10, "Enter a valid phone").optional().or(z.literal("")),
  pan: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Invalid PAN format")
    .optional()
    .or(z.literal("")),
  source: z.enum(["Referral", "Website", "Campaign", "RM Direct"]),
  notes: z.string().max(500).optional().or(z.literal("")),
  assignedRm: z.string().optional(),
});

export type InviteLeadInput = z.infer<typeof inviteLeadSchema>;

export const rejectReasonSchema = z.object({
  reason: z.string().min(5, "Provide a brief reason"),
});
export type RejectReasonInput = z.infer<typeof rejectReasonSchema>;
