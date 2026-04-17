import { useQuery } from "@tanstack/react-query";
import { SCHEMES_FIXTURE } from "./fixtures";
import type { Scheme } from "@/types/scheme";

const SCHEMES_KEY = ["schemes", "list"] as const;

function delay<T>(value: T, ms = 280): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export function useSchemesQuery() {
  return useQuery<Scheme[]>({
    queryKey: SCHEMES_KEY,
    queryFn: () => delay(SCHEMES_FIXTURE),
    staleTime: 60_000,
  });
}

export function useSchemeQuery(schemeId: string | undefined) {
  return useQuery<Scheme | undefined>({
    queryKey: ["schemes", "detail", schemeId],
    queryFn: () => delay(SCHEMES_FIXTURE.find((s) => s.id === schemeId), 200),
    staleTime: 60_000,
    enabled: !!schemeId,
  });
}
