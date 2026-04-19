import { useMutation } from "@tanstack/react-query";
import type {
  LumpsumOrderRequest,
  OrderConfirmation,
  RedeemOrderRequest,
  SipOrderRequest,
  SwitchOrderRequest,
} from "@/types/orders";
import { SCHEMES_FIXTURE } from "@/features/schemes/fixtures";
import { HOLDINGS_FIXTURE } from "@/features/portfolio/fixtures";

function delay<T>(value: T, ms = 700): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function genOrderId(): string {
  return `ORD${Math.floor(900000 + Math.random() * 99999)}`;
}
function genBseRef(): string {
  return `BSE${Date.now().toString().slice(-9)}`;
}
function nextBusinessDayIso(daysAhead = 1): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString();
}

/* ─── Lumpsum ───────────────────────────────────────────────────────── */

async function executeLumpsum(req: LumpsumOrderRequest): Promise<OrderConfirmation> {
  const scheme = SCHEMES_FIXTURE.find((s) => s.id === req.schemeId);
  return delay({
    orderId: genOrderId(),
    bseOrderRef: genBseRef(),
    status: "accepted" as const,
    orderType: "lumpsum" as const,
    primaryAmount: req.amount,
    schemeName: scheme?.schemeName ?? "Selected Scheme",
    estimatedNavDate: nextBusinessDayIso(1),
    createdAt: new Date().toISOString(),
  });
}

export function useExecuteLumpsumMutation() {
  return useMutation<OrderConfirmation, Error, LumpsumOrderRequest>({ mutationFn: executeLumpsum });
}

/* ─── SIP ───────────────────────────────────────────────────────────── */

async function executeSip(req: SipOrderRequest): Promise<OrderConfirmation> {
  const scheme = SCHEMES_FIXTURE.find((s) => s.id === req.schemeId);
  return delay({
    orderId: genOrderId(),
    bseOrderRef: genBseRef(),
    status: "accepted" as const,
    orderType: "sip" as const,
    primaryAmount: req.monthlyAmount,
    schemeName: scheme?.schemeName ?? "Selected Scheme",
    estimatedNavDate: req.startDate,
    createdAt: new Date().toISOString(),
    mandateRef: `NACH${Date.now().toString().slice(-8)}`,
    firstDebitDate: req.startDate,
  });
}

export function useExecuteSipMutation() {
  return useMutation<OrderConfirmation, Error, SipOrderRequest>({ mutationFn: executeSip });
}

/* ─── Redeem ────────────────────────────────────────────────────────── */

async function executeRedeem(req: RedeemOrderRequest): Promise<OrderConfirmation> {
  const holding = HOLDINGS_FIXTURE.find((h) => h.id === req.holdingId);
  let units = 0;
  let proceeds = 0;
  if (holding) {
    if (req.mode === "all") {
      units = holding.units;
      proceeds = holding.currentValue;
    } else if (req.mode === "amount" && req.amount) {
      proceeds = req.amount;
      units = req.amount / holding.currentNav;
    } else if (req.mode === "units" && req.units) {
      units = req.units;
      proceeds = req.units * holding.currentNav;
    }
  }
  const credit = new Date();
  credit.setDate(credit.getDate() + 3); // T+3 for equity
  return delay({
    orderId: genOrderId(),
    bseOrderRef: genBseRef(),
    status: "accepted" as const,
    orderType: "redeem" as const,
    primaryAmount: Math.round(proceeds),
    schemeName: holding?.schemeName ?? "Selected Holding",
    estimatedNavDate: nextBusinessDayIso(1),
    createdAt: new Date().toISOString(),
    creditEtaDate: credit.toISOString(),
    estimatedProceeds: Math.round(proceeds),
    units: Number(units.toFixed(3)),
  });
}

export function useExecuteRedeemMutation() {
  return useMutation<OrderConfirmation, Error, RedeemOrderRequest>({ mutationFn: executeRedeem });
}

/* ─── Switch ────────────────────────────────────────────────────────── */

async function executeSwitch(req: SwitchOrderRequest): Promise<OrderConfirmation> {
  const from = HOLDINGS_FIXTURE.find((h) => h.id === req.fromHoldingId);
  const to = SCHEMES_FIXTURE.find((s) => s.id === req.toSchemeId);
  let units = 0;
  let amount = 0;
  if (from) {
    if (req.mode === "all") {
      units = from.units;
      amount = from.currentValue;
    } else if (req.mode === "amount" && req.amount) {
      amount = req.amount;
      units = req.amount / from.currentNav;
    } else if (req.mode === "units" && req.units) {
      units = req.units;
      amount = req.units * from.currentNav;
    }
  }
  return delay({
    orderId: genOrderId(),
    bseOrderRef: genBseRef(),
    status: "accepted" as const,
    orderType: "switch" as const,
    primaryAmount: Math.round(amount),
    schemeName: from?.schemeName ?? "Source",
    toSchemeName: to?.schemeName ?? "Destination",
    estimatedNavDate: nextBusinessDayIso(1),
    createdAt: new Date().toISOString(),
    units: Number(units.toFixed(3)),
  });
}

export function useExecuteSwitchMutation() {
  return useMutation<OrderConfirmation, Error, SwitchOrderRequest>({ mutationFn: executeSwitch });
}
