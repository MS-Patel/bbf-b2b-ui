import { useQuery } from "@tanstack/react-query";
import { KYC_FIXTURE } from "./fixtures";
import type { KycOverview } from "@/types/kyc";

const KYC_KEY = ["kyc", "overview"] as const;

function delay<T>(value: T, ms = 280): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export function useKycOverviewQuery() {
  return useQuery<KycOverview>({
    queryKey: KYC_KEY,
    queryFn: () => delay(KYC_FIXTURE),
    staleTime: 60_000,
  });
}
