import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MANDATES_FIXTURE, ORDERS_FIXTURE, SCHEMES_FIXTURE } from "./fixtures";
import type { Order, OrderStatus, PlacedByRole } from "@/types/orders";
import type { PlaceOrderInput } from "./schemas";
import type { ClientLite } from "@/types/rm";
import { RM_CLIENTS_FIXTURE } from "@/features/rm/fixtures";

/**
 * Mock orders API. Real wiring should call:
 *   GET    /orders/                       -> useOrdersQuery
 *   POST   /orders/                       -> usePlaceOrderMutation
 *   POST   /orders/{id}/cancel/           -> useCancelOrderMutation
 *   POST   /orders/{id}/retry/            -> useRetryOrderMutation
 *   GET    /schemes/                      -> useSchemesQuery
 *   GET    /clients/{id}/mandates/        -> useMandatesQuery
 */

const KEY = ["orders"] as const;
const LATENCY = 280;

let store: Order[] = [...ORDERS_FIXTURE];

function delay<T>(value: T, ms = LATENCY): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
function id(): string {
  return Math.random().toString(36).slice(2, 12);
}

interface OrdersQueryArgs {
  scope: "all" | "rm" | "distributor";
  ownerId?: string;
}

export function useOrdersQuery({ scope, ownerId }: OrdersQueryArgs) {
  return useQuery({
    queryKey: [...KEY, scope, ownerId ?? "*"],
    queryFn: async () => {
      const all = await delay([...store]);
      if (scope === "all") return all;
      if (scope === "rm") return all.filter((o) => o.placedByRole === "rm" && (ownerId ? o.placedById === ownerId : true));
      return all.filter((o) => o.placedByRole === "distributor" && (ownerId ? o.placedById === ownerId : true));
    },
    staleTime: 30_000,
  });
}

export function useSchemesQuery(search?: string) {
  return useQuery({
    queryKey: [...KEY, "schemes", search ?? ""],
    queryFn: async () => {
      const q = (search ?? "").trim().toLowerCase();
      const all = SCHEMES_FIXTURE.filter((s) => !q || `${s.name} ${s.amc} ${s.category}`.toLowerCase().includes(q));
      return delay(all);
    },
    staleTime: 60_000,
  });
}

export function useMandatesQuery(clientId: string | undefined) {
  return useQuery({
    queryKey: [...KEY, "mandates", clientId ?? ""],
    enabled: !!clientId,
    queryFn: async () => delay(MANDATES_FIXTURE.filter((m) => m.clientId === clientId)),
    staleTime: 60_000,
  });
}

interface EligibleArgs {
  scope: "all" | "rm" | "distributor";
  /** Currently unused in mock; real API would filter by RM/distributor mapping. */
  ownerId?: string;
}
export function useEligibleClientsQuery(_args: EligibleArgs) {
  return useQuery<ClientLite[]>({
    queryKey: [...KEY, "eligible-clients", _args.scope, _args.ownerId ?? "*"],
    queryFn: async () => delay(RM_CLIENTS_FIXTURE.filter((c) => c.kycStatus === "verified")),
    staleTime: 60_000,
  });
}

interface PlaceArgs {
  input: PlaceOrderInput;
  placedBy: { id: string; name: string; role: PlacedByRole };
}

export function usePlaceOrderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ input, placedBy }: PlaceArgs): Promise<Order> => {
      const sch = SCHEMES_FIXTURE.find((s) => s.code === input.schemeCode);
      if (!sch) throw new Error("Unknown scheme");
      const client = RM_CLIENTS_FIXTURE.find((c) => c.id === input.clientId);
      if (!client) throw new Error("Unknown client");
      const now = new Date().toISOString();
      const base: Order = {
        id: `ord_${id()}`,
        clientId: client.id,
        clientName: client.fullName,
        type: input.type,
        status: "pending",
        schemeCode: sch.code,
        schemeName: sch.name,
        amc: sch.amc,
        nav: sch.latestNav,
        placedById: placedBy.id,
        placedByName: placedBy.name,
        placedByRole: placedBy.role,
        placedAt: now,
        consent: input.consent,
        reference: input.reference || undefined,
      };
      let order: Order = base;
      if (input.type === "lump_sum") {
        order = { ...base, amount: input.amount, units: +(input.amount / sch.latestNav).toFixed(3), folio: input.folio || undefined };
      } else if (input.type === "sip") {
        order = {
          ...base,
          amount: input.amount,
          sipFrequency: input.frequency,
          sipDate: input.sipDate,
          sipTenureMonths: input.tenure,
          mandateId: input.mandateId,
          firstDebitOn: nextSipDate(input.sipDate),
        };
      } else if (input.type === "switch") {
        const target = SCHEMES_FIXTURE.find((s) => s.code === input.switchTargetCode);
        order = {
          ...base,
          units: input.units,
          switchTargetCode: input.switchTargetCode,
          switchTargetName: target?.name,
        };
      } else if (input.type === "redeem") {
        order = {
          ...base,
          amount: input.amount,
          units: +(input.amount / sch.latestNav).toFixed(3),
          redeemAll: input.redeemAll,
          payoutBank: input.payoutBank,
        };
      } else if (input.type === "stp") {
        const target = SCHEMES_FIXTURE.find((s) => s.code === input.switchTargetCode);
        order = {
          ...base,
          amount: input.amount,
          sipFrequency: input.frequency,
          transferDay: input.transferDay,
          installments: input.installments,
          switchTargetCode: input.switchTargetCode,
          switchTargetName: target?.name,
          firstDebitOn: nextSipDate(input.transferDay),
        };
      } else if (input.type === "swp") {
        order = {
          ...base,
          amount: input.amount,
          sipFrequency: input.frequency,
          transferDay: input.transferDay,
          installments: input.installments,
          payoutBank: input.payoutBank,
          firstDebitOn: nextSipDate(input.transferDay),
        };
      }
      store = [order, ...store];
      // Auto-progress for the demo: pending → processing → completed.
      setTimeout(() => advance(order.id, "processing"), 1200);
      setTimeout(() => advance(order.id, "completed"), 2800);
      return delay(order);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

function advance(orderId: string, status: OrderStatus) {
  store = store.map((o) =>
    o.id === orderId
      ? { ...o, status, settledAt: status === "completed" ? new Date().toISOString() : o.settledAt }
      : o,
  );
}

function nextSipDate(day: number): string {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), day);
  if (target <= now) target.setMonth(target.getMonth() + 1);
  return target.toISOString();
}

export function useCancelOrderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      store = store.map((o) => (o.id === orderId && o.status === "pending" ? { ...o, status: "cancelled" as const } : o));
      return delay(true);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRetryOrderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      store = store.map((o) => (o.id === orderId && o.status === "failed" ? { ...o, status: "pending" as const, failureReason: undefined } : o));
      const o = store.find((x) => x.id === orderId);
      if (o) {
        setTimeout(() => advance(o.id, "processing"), 1000);
        setTimeout(() => advance(o.id, "completed"), 2400);
      }
      return delay(true);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
