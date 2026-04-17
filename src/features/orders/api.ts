import { useMutation } from "@tanstack/react-query";
import type { LumpsumOrderRequest, OrderConfirmation } from "@/types/orders";
import { SCHEMES_FIXTURE } from "@/features/schemes/fixtures";

function delay<T>(value: T, ms = 700): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

async function executeLumpsum(req: LumpsumOrderRequest): Promise<OrderConfirmation> {
  const scheme = SCHEMES_FIXTURE.find((s) => s.id === req.schemeId);
  const orderId = `ORD${Math.floor(900000 + Math.random() * 99999)}`;
  const bseRef = `BSE${Date.now().toString().slice(-9)}`;
  const navDate = new Date();
  navDate.setDate(navDate.getDate() + 1);
  return delay({
    orderId,
    bseOrderRef: bseRef,
    status: "accepted" as const,
    amount: req.amount,
    schemeName: scheme?.schemeName ?? "Selected Scheme",
    estimatedNavDate: navDate.toISOString(),
    createdAt: new Date().toISOString(),
  });
}

export function useExecuteLumpsumMutation() {
  return useMutation<OrderConfirmation, Error, LumpsumOrderRequest>({
    mutationFn: executeLumpsum,
  });
}
