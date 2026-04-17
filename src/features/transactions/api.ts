import { useQuery } from "@tanstack/react-query";
import { TRANSACTIONS_FIXTURE } from "./fixtures";
import type { Transaction } from "@/types/transaction";

const TRANSACTIONS_KEY = ["transactions", "list"] as const;

function delay<T>(value: T, ms = 320): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export function useTransactionsQuery() {
  return useQuery<Transaction[]>({
    queryKey: TRANSACTIONS_KEY,
    queryFn: () => delay(TRANSACTIONS_FIXTURE),
    staleTime: 60_000,
  });
}
