import { useQuery } from "@tanstack/react-query";
import { DISTRIBUTOR_OVERVIEW_FIXTURE, SUB_BROKERS_FIXTURE } from "./fixtures";

function delay<T>(value: T, ms = 380): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export function useDistributorOverviewQuery() {
  return useQuery({ queryKey: ["distributor", "overview"], queryFn: () => delay(DISTRIBUTOR_OVERVIEW_FIXTURE), staleTime: 60_000 });
}
export function useSubBrokersQuery() {
  return useQuery({ queryKey: ["distributor", "sub-brokers"], queryFn: () => delay(SUB_BROKERS_FIXTURE), staleTime: 60_000 });
}
