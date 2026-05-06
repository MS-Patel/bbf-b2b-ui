import { useQuery } from "@tanstack/react-query";
import { buildReportsHistory } from "./fixtures";

function delay<T>(value: T, ms = 320): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export function useClientReportsHistoryQuery(scope: "rm" | "distributor", by: string) {
  return useQuery({
    queryKey: ["reports", scope, by],
    queryFn: () => delay(buildReportsHistory(scope === "rm" ? 911 : 922, by)),
    staleTime: 60_000,
  });
}
