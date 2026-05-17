import { useQuery } from "@tanstack/react-query";
import { INVESTORS_FIXTURE } from "./fixtures";

function delay<T>(value: T, ms = 280): Promise<T> {
  return new Promise((r) => setTimeout(() => r(value), ms));
}

export function useInvestorsQuery() {
  return useQuery({ queryKey: ["admin", "investors"], queryFn: () => delay(INVESTORS_FIXTURE) });
}

export function useInvestorQuery(id: string | undefined) {
  return useQuery({
    queryKey: ["admin", "investor", id],
    queryFn: () => delay(INVESTORS_FIXTURE.find((i) => i.id === id) ?? null),
    enabled: !!id,
  });
}
