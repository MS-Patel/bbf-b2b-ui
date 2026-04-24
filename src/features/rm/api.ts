import { useQuery } from "@tanstack/react-query";
import { DISTRIBUTORS_FIXTURE } from "@/features/admin/fixtures";
import { RM_CLIENTS_FIXTURE, RM_EARNINGS_FIXTURE, RM_LEADS_FIXTURE } from "./fixtures";

function delay<T>(value: T, ms = 380): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export function useRmClientsQuery() {
  return useQuery({ queryKey: ["rm", "clients"], queryFn: () => delay(RM_CLIENTS_FIXTURE), staleTime: 60_000 });
}
export function useRmLeadsQuery() {
  return useQuery({ queryKey: ["rm", "leads"], queryFn: () => delay(RM_LEADS_FIXTURE), staleTime: 60_000 });
}
export function useRmEarningsQuery() {
  return useQuery({ queryKey: ["rm", "earnings"], queryFn: () => delay(RM_EARNINGS_FIXTURE), staleTime: 60_000 });
}
export function useRmDistributorsQuery(ownerId?: string) {
  return useQuery({
    queryKey: ["rm", "distributors", ownerId ?? "current"],
    queryFn: () => delay(DISTRIBUTORS_FIXTURE.filter((d) => !ownerId || d.rmOwnerId === ownerId || d.rmOwnerId === "rm_001")),
    staleTime: 60_000,
  });
}
