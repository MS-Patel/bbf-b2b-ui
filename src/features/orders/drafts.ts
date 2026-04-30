/**
 * Lightweight localStorage-backed draft store for in-progress order tickets.
 * Drafts are scoped per user (placedById) and never leave the browser.
 */
import type { OrderType } from "@/types/orders";

const KEY = "orders.drafts.v1";

export interface OrderDraft {
  id: string;
  ownerId: string;
  ownerRole: string;
  clientId?: string;
  clientName?: string;
  type: OrderType;
  schemeCode?: string;
  schemeName?: string;
  amount?: number;
  folio?: string;
  paymentMode?: "netbanking" | "upi" | "neft";
  frequency?: "monthly" | "quarterly";
  sipDate?: number;
  tenure?: string;
  mandateId?: string;
  units?: number;
  switchAll?: boolean;
  switchTargetCode?: string;
  redeemAll?: boolean;
  payoutBank?: string;
  transferDay?: number;
  installments?: string;
  reference?: string;
  step: number;
  updatedAt: string;
}

function read(): OrderDraft[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as OrderDraft[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(list: OrderDraft[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("orders:drafts-updated"));
}

export function listDrafts(ownerId: string): OrderDraft[] {
  return read()
    .filter((d) => d.ownerId === ownerId)
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
}

export function getDraft(id: string): OrderDraft | undefined {
  return read().find((d) => d.id === id);
}

export function saveDraft(draft: OrderDraft): OrderDraft {
  const next = { ...draft, updatedAt: new Date().toISOString() };
  const list = read().filter((d) => d.id !== draft.id);
  write([next, ...list]);
  return next;
}

export function deleteDraft(id: string) {
  write(read().filter((d) => d.id !== id));
}

export function newDraftId(): string {
  return `draft_${Math.random().toString(36).slice(2, 10)}`;
}
