import { z } from "zod";

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
