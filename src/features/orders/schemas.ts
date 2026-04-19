import { z } from "zod";

/* ─── Lumpsum (existing) ────────────────────────────────────────────── */

export const lumpsumSchemeStepSchema = z.object({
  schemeId: z.string().min(1, "Please choose a scheme to continue."),
});

export const lumpsumAmountStepSchema = z
  .object({
    amount: z
      .number({ message: "Amount is required." })
      .min(100, "Minimum amount is ₹100.")
      .max(10_000_000, "Maximum amount per order is ₹1 crore."),
    bankAccountId: z.string().min(1, "Select a bank account."),
    folioMode: z.enum(["new", "existing"]),
    folioNumber: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.folioMode === "existing" && !data.folioNumber?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["folioNumber"],
        message: "Folio number is required when using an existing folio.",
      });
    }
  });

export type LumpsumSchemeStep = z.infer<typeof lumpsumSchemeStepSchema>;
export type LumpsumAmountStep = z.infer<typeof lumpsumAmountStepSchema>;

/* ─── SIP ───────────────────────────────────────────────────────────── */

export const sipDetailsStepSchema = z
  .object({
    monthlyAmount: z
      .number({ message: "SIP amount is required." })
      .min(500, "Minimum SIP installment is ₹500.")
      .max(500_000, "Maximum SIP installment is ₹5,00,000."),
    frequency: z.enum(["monthly", "quarterly"]),
    startDate: z.date({ message: "Pick a start date." }),
    perpetual: z.boolean(),
    tenureMonths: z.number().int().min(6).max(360).optional(),
    bankAccountId: z.string().min(1, "Select a bank account for the NACH mandate."),
    folioMode: z.enum(["new", "existing"]),
    folioNumber: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // start date must be ≥ today + 5 calendar days (NACH cooling-off)
    const min = new Date();
    min.setHours(0, 0, 0, 0);
    min.setDate(min.getDate() + 5);
    if (data.startDate < min) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["startDate"],
        message: "Start date must be at least 5 days from today (NACH registration time).",
      });
    }
    if (!data.perpetual) {
      if (data.tenureMonths == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["tenureMonths"],
          message: "Set a tenure or choose perpetual.",
        });
      }
    }
    if (data.folioMode === "existing" && !data.folioNumber?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["folioNumber"],
        message: "Folio number is required.",
      });
    }
  });

export type SipDetailsStep = z.infer<typeof sipDetailsStepSchema>;

/* ─── Redeem ────────────────────────────────────────────────────────── */

export const redeemDetailsStepSchema = z
  .object({
    mode: z.enum(["amount", "units", "all"]),
    amount: z.number().positive().optional(),
    units: z.number().positive().optional(),
    bankAccountId: z.string().min(1, "Select a bank account for credit."),
    /** Sentinel for cross-field validation; set by the wizard. */
    maxAmount: z.number().positive(),
    maxUnits: z.number().positive(),
  })
  .superRefine((data, ctx) => {
    if (data.mode === "amount") {
      if (!data.amount || data.amount < 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["amount"],
          message: "Enter at least ₹100.",
        });
      } else if (data.amount > data.maxAmount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["amount"],
          message: `Cannot exceed current value of ₹${data.maxAmount.toLocaleString("en-IN")}.`,
        });
      }
    }
    if (data.mode === "units") {
      if (!data.units || data.units <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["units"],
          message: "Enter the number of units.",
        });
      } else if (data.units > data.maxUnits) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["units"],
          message: `You only hold ${data.maxUnits} units.`,
        });
      }
    }
  });

export type RedeemDetailsStep = z.infer<typeof redeemDetailsStepSchema>;

/* ─── Switch ────────────────────────────────────────────────────────── */

export const switchDetailsStepSchema = z
  .object({
    toSchemeId: z.string().min(1, "Choose a destination scheme."),
    mode: z.enum(["amount", "units", "all"]),
    amount: z.number().positive().optional(),
    units: z.number().positive().optional(),
    folioMode: z.enum(["new", "existing"]),
    folioNumber: z.string().optional(),
    maxAmount: z.number().positive(),
    maxUnits: z.number().positive(),
  })
  .superRefine((data, ctx) => {
    if (data.mode === "amount") {
      if (!data.amount || data.amount < 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["amount"],
          message: "Enter at least ₹100.",
        });
      } else if (data.amount > data.maxAmount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["amount"],
          message: `Cannot exceed source value of ₹${data.maxAmount.toLocaleString("en-IN")}.`,
        });
      }
    }
    if (data.mode === "units") {
      if (!data.units || data.units <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["units"],
          message: "Enter the number of units to switch.",
        });
      } else if (data.units > data.maxUnits) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["units"],
          message: `You only hold ${data.maxUnits} units.`,
        });
      }
    }
    if (data.folioMode === "existing" && !data.folioNumber?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["folioNumber"],
        message: "Folio number is required.",
      });
    }
  });

export type SwitchDetailsStep = z.infer<typeof switchDetailsStepSchema>;
