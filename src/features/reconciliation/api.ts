import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RECONCILIATION_ERRORS, RECONCILIATION_FILES } from "./fixtures";
import type { ReconciliationFile, RtaSource } from "@/types/reconciliation";

const FILES_KEY = ["reconciliation", "files"] as const;
const ERRORS_KEY = (fileId: string) => ["reconciliation", "errors", fileId] as const;

function delay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((r) => setTimeout(() => r(value), ms));
}

// Local in-memory overlay so newly uploaded files appear in the table.
const sessionFiles: ReconciliationFile[] = [];

export function useReconciliationFilesQuery() {
  return useQuery({
    queryKey: FILES_KEY,
    queryFn: () =>
      delay(
        [...sessionFiles, ...RECONCILIATION_FILES].sort(
          (a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt),
        ),
      ),
    staleTime: 30_000,
  });
}

export function useReconciliationErrorsQuery(fileId: string | null) {
  return useQuery({
    queryKey: ERRORS_KEY(fileId ?? "none"),
    enabled: !!fileId,
    queryFn: () => delay(RECONCILIATION_ERRORS.filter((e) => e.fileId === fileId)),
    staleTime: 30_000,
  });
}

export interface UploadFilePayload {
  source: RtaSource;
  fileName: string;
  uploadedBy: string;
}

export function useUploadReconciliationFileMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UploadFilePayload): Promise<ReconciliationFile> => {
      await new Promise((r) => setTimeout(r, 800));
      const file: ReconciliationFile = {
        id: `rec_${Date.now()}`,
        source: payload.source,
        fileName: payload.fileName,
        uploadedAt: new Date().toISOString(),
        uploadedBy: payload.uploadedBy,
        status: "processing",
        totalRows: 0,
        matchedRows: 0,
        errorRows: 0,
      };
      sessionFiles.unshift(file);
      return file;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: FILES_KEY }),
  });
}
