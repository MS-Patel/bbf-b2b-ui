/**
 * Order-flow helpers: recent clients (from previous orders), per-client holdings preview,
 * cut-off countdown formatting, indicative charges (mock), and risk suitability.
 */
import { ORDERS_FIXTURE } from "./fixtures";
import type { Order, RiskBand, SchemeLite } from "@/types/orders";

export const RISK_LEVEL: Record<string, number> = {
  Conservative: 1,
  Moderate: 2,
  Aggressive: 3,
};

export const SCHEME_RISK: Record<RiskBand, number> = {
  Low: 1,
  Moderate: 2,
  High: 3,
  "Very High": 4,
};

export interface HoldingPreview {
  schemeCode: string;
  schemeName: string;
  amc: string;
  units: number;
  invested: number;
  folio?: string;
}

/** Aggregate completed orders for a client into pseudo-holdings. */
export function holdingsForClient(clientId: string): HoldingPreview[] {
  const map = new Map<string, HoldingPreview>();
  ORDERS_FIXTURE.filter(
    (o) => o.clientId === clientId && o.status === "completed" && (o.type === "lump_sum" || o.type === "sip"),
  ).forEach((o) => {
    const cur = map.get(o.schemeCode);
    if (cur) {
      cur.units += o.units ?? 0;
      cur.invested += o.amount ?? 0;
    } else {
      map.set(o.schemeCode, {
        schemeCode: o.schemeCode,
        schemeName: o.schemeName,
        amc: o.amc,
        units: o.units ?? 0,
        invested: o.amount ?? 0,
        folio: o.folio,
      });
    }
  });
  return Array.from(map.values()).sort((a, b) => b.invested - a.invested);
}

/** Most recent client IDs ordered by latest order placedAt. */
export function recentClientIds(limit = 5, ownerId?: string): string[] {
  const seen = new Set<string>();
  const ordered = [...ORDERS_FIXTURE].sort(
    (a, b) => +new Date(b.placedAt) - +new Date(a.placedAt),
  );
  for (const o of ordered) {
    if (ownerId && o.placedById !== ownerId) continue;
    if (!seen.has(o.clientId)) seen.add(o.clientId);
    if (seen.size >= limit) break;
  }
  return Array.from(seen);
}

/** Returns minutes left to the daily cutoff (HH:mm). Negative if passed. */
export function minutesToCutoff(cutoff: string, now = new Date()): number {
  const [hStr, mStr] = cutoff.split(":");
  const h = Number(hStr ?? "15");
  const m = Number(mStr ?? "0");
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 60000);
}

export function formatCutoffCountdown(minutes: number): string {
  if (minutes < 0) return "Cut-off passed — next NAV";
  if (minutes < 60) return `${minutes} min to cut-off`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m to cut-off`;
}

/** Mock charges. Real wiring would come from BSE Star MF / RTA. */
export function estimateCharges(amount: number, scheme: SchemeLite) {
  const stampDuty = +(amount * 0.00005).toFixed(2);
  const exitLoad = scheme.exitLoadDays > 0 ? "1.0% if redeemed before " + scheme.exitLoadDays + " days" : "Nil";
  const stt = "Nil on purchase";
  return { stampDuty, exitLoad, stt };
}

export type SuitabilityLevel = "ok" | "warn" | "block";

export function evaluateSuitability(
  scheme: SchemeLite | null,
  riskProfile: string | undefined,
): { level: SuitabilityLevel; message: string } {
  if (!scheme || !riskProfile) return { level: "ok", message: "" };
  const sr = SCHEME_RISK[scheme.riskBand] ?? 1;
  const ir = RISK_LEVEL[riskProfile] ?? 1;
  if (sr <= ir) return { level: "ok", message: `Aligned with ${riskProfile} profile` };
  if (sr === ir + 1) return { level: "warn", message: `One band above ${riskProfile} profile — proceed with caution` };
  return { level: "block", message: `Significantly riskier than ${riskProfile} profile — explicit consent required` };
}

export type { Order };
