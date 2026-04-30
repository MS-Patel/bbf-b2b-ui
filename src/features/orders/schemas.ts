import { z } from "zod";

const consentSchema = z.object({
  investorConsent: z.boolean().refine((v) => v, "Investor consent required"),
  riskAck: z.boolean().refine((v) => v, "Risk acknowledgement required"),
  cutoffAck: z.boolean().refine((v) => v, "Cut-off acknowledgement required"),
});

export const lumpSumSchema = z.object({
  type: z.literal("lump_sum"),
  clientId: z.string().min(1, "Pick a client"),
  schemeCode: z.string().min(1, "Pick a scheme"),
  amount: z.number().min(500, "Minimum ₹500"),
  folio: z.string().optional().or(z.literal("")),
  paymentMode: z.enum(["netbanking", "upi", "neft"]),
  reference: z.string().max(120).optional().or(z.literal("")),
  consent: consentSchema,
});

export const sipSchema = z.object({
  type: z.literal("sip"),
  clientId: z.string().min(1, "Pick a client"),
  schemeCode: z.string().min(1, "Pick a scheme"),
  amount: z.number().min(500, "Minimum ₹500"),
  frequency: z.enum(["monthly", "quarterly"]),
  sipDate: z.number().int().min(1).max(28),
  tenure: z.union([z.number().int().min(6), z.literal("perpetual")]),
  mandateId: z.string().min(1, "Select a mandate"),
  reference: z.string().max(120).optional().or(z.literal("")),
  consent: consentSchema,
});

export const switchSchema = z.object({
  type: z.literal("switch"),
  clientId: z.string().min(1, "Pick a client"),
  schemeCode: z.string().min(1, "Pick source scheme"),
  switchTargetCode: z.string().min(1, "Pick target scheme"),
  units: z.number().min(0.001, "Enter units"),
  switchAll: z.boolean(),
  reference: z.string().max(120).optional().or(z.literal("")),
  consent: consentSchema,
});

export const redeemSchema = z.object({
  type: z.literal("redeem"),
  clientId: z.string().min(1, "Pick a client"),
  schemeCode: z.string().min(1, "Pick a scheme"),
  amount: z.number().min(500, "Minimum ₹500"),
  redeemAll: z.boolean(),
  payoutBank: z.string().min(1, "Select payout bank"),
  reference: z.string().max(120).optional().or(z.literal("")),
  consent: consentSchema,
});

export const stpSchema = z.object({
  type: z.literal("stp"),
  clientId: z.string().min(1, "Pick a client"),
  schemeCode: z.string().min(1, "Pick source scheme"),
  switchTargetCode: z.string().min(1, "Pick target scheme"),
  amount: z.number().min(500, "Minimum ₹500"),
  frequency: z.enum(["monthly", "quarterly"]),
  transferDay: z.number().int().min(1).max(28),
  installments: z.union([z.number().int().min(6), z.literal("perpetual")]),
  reference: z.string().max(120).optional().or(z.literal("")),
  consent: consentSchema,
});

export const swpSchema = z.object({
  type: z.literal("swp"),
  clientId: z.string().min(1, "Pick a client"),
  schemeCode: z.string().min(1, "Pick a scheme"),
  amount: z.number().min(500, "Minimum ₹500"),
  frequency: z.enum(["monthly", "quarterly"]),
  transferDay: z.number().int().min(1).max(28),
  installments: z.union([z.number().int().min(6), z.literal("perpetual")]),
  payoutBank: z.string().min(1, "Select payout bank"),
  reference: z.string().max(120).optional().or(z.literal("")),
  consent: consentSchema,
});

export const placeOrderSchema = z.discriminatedUnion("type", [
  lumpSumSchema,
  sipSchema,
  switchSchema,
  redeemSchema,
  stpSchema,
  swpSchema,
]);

export type LumpSumInput = z.infer<typeof lumpSumSchema>;
export type SipInput = z.infer<typeof sipSchema>;
export type SwitchInput = z.infer<typeof switchSchema>;
export type RedeemInput = z.infer<typeof redeemSchema>;
export type StpInput = z.infer<typeof stpSchema>;
export type SwpInput = z.infer<typeof swpSchema>;
export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
