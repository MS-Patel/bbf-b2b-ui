import { z } from "zod";

export const uploadReconciliationSchema = z.object({
  source: z.enum(["CAMS", "KFINTECH"]),
  fileName: z.string().min(3, "File name required"),
});

export type UploadReconciliationValues = z.infer<typeof uploadReconciliationSchema>;
