import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ONBOARDING_LEADS_FIXTURE, ONBOARDING_OWNERS } from "./fixtures";
import type { KycChecklist, KycItemKey, KycItemStatus, LeadStage, OnboardingLead, OwnerRole } from "./types";
import type { InviteLeadInput } from "./schemas";
import type { Notification } from "@/types/notifications";
import type { ClientLite } from "@/types/rm";
import { RM_CLIENTS_FIXTURE } from "@/features/rm/fixtures";

const LATENCY = 250;
const KEY = ["onboarding", "leads"] as const;

let store: OnboardingLead[] = [...ONBOARDING_LEADS_FIXTURE];
const notifBus: Notification[] = [];

function delay<T>(value: T, ms = LATENCY): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function cryptoLikeId(): string {
  return Math.random().toString(36).slice(2, 14);
}

function pushNotif(n: Omit<Notification, "id" | "createdAt" | "read">): void {
  notifBus.push({
    id: `ntf_ob_${cryptoLikeId()}`,
    createdAt: new Date().toISOString(),
    read: false,
    ...n,
  });
}

export function consumeOnboardingNotifications(): Notification[] {
  const out = [...notifBus];
  notifBus.length = 0;
  return out;
}

function deriveStageFromChecklist(cl: KycChecklist, current: LeadStage): LeadStage {
  const values = Object.values(cl);
  const allVerified = values.every((v) => v === "verified");
  if (allVerified) return current === "first_invest" ? "first_invest" : "verified";
  const anySubmitted = values.some((v) => v === "submitted" || v === "verified");
  const allSubmitted = values.every((v) => v === "submitted" || v === "verified");
  if (allSubmitted) return "kyc_in_review";
  if (anySubmitted) return "kyc_started";
  return current === "lead" ? "lead" : current;
}

interface LeadsQueryArgs {
  scope: "mine" | "all";
  ownerId?: string;
}

export function useLeadsQuery({ scope, ownerId }: LeadsQueryArgs) {
  return useQuery({
    queryKey: [...KEY, scope, ownerId ?? "*"],
    queryFn: async () => {
      const all = await delay([...store]);
      if (scope === "all") return all;
      return all.filter((l) => (ownerId ? l.ownerId === ownerId : false));
    },
    staleTime: 30_000,
  });
}

export function useLeadQuery(id: string | undefined) {
  return useQuery({
    queryKey: [...KEY, "one", id],
    enabled: !!id,
    queryFn: async () => {
      const found = store.find((l) => l.id === id);
      return delay(found ?? null);
    },
  });
}

export function useInviteLeadMutation(owner: { id: string; role: OwnerRole; name: string }) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: InviteLeadInput): Promise<OnboardingLead> => {
      const now = new Date().toISOString();
      const lead: OnboardingLead = {
        id: `ld_${cryptoLikeId()}`,
        fullName: input.fullName,
        email: input.email,
        phone: input.phone || undefined,
        pan: input.pan || undefined,
        stage: "lead",
        source: input.source,
        ownerId: owner.id,
        ownerRole: owner.role,
        ownerName: owner.name,
        assignedRm: input.assignedRm,
        notes: input.notes || undefined,
        kycChecklist: { pan: "pending", aadhaar: "pending", bank: "pending", nominee: "pending", fatca: "pending", esign: "pending" },
        inviteSentAt: now,
        inviteLink: `https://buybestfin.app/invite/${cryptoLikeId()}`,
        createdAt: now,
        updatedAt: now,
        history: [{ at: now, stage: "lead", note: "Invite sent" }],
      };
      store = [lead, ...store];
      pushNotif({ category: "kyc", severity: "info", title: "New lead invited", body: `${input.fullName} was invited to onboard.` });
      return delay(lead);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useUpdateKycChecklistMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, item, status }: { id: string; item: KycItemKey; status: KycItemStatus }) => {
      const idx = store.findIndex((l) => l.id === id);
      if (idx < 0) throw new Error("Lead not found");
      const lead = store[idx]!;
      const nextChecklist: KycChecklist = { ...lead.kycChecklist, [item]: status };
      const nextStage = deriveStageFromChecklist(nextChecklist, lead.stage);
      const now = new Date().toISOString();
      const updated: OnboardingLead = {
        ...lead,
        kycChecklist: nextChecklist,
        stage: nextStage,
        updatedAt: now,
        history: nextStage !== lead.stage ? [...lead.history, { at: now, stage: nextStage }] : lead.history,
      };
      store = store.map((l) => (l.id === id ? updated : l));
      if (nextStage === "verified" && lead.stage !== "verified") {
        pushNotif({ category: "kyc", severity: "success", title: "KYC verified", body: `${lead.fullName} is fully verified and ready to convert.` });
      }
      return delay(updated);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useAdvanceStageMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: LeadStage }) => {
      const idx = store.findIndex((l) => l.id === id);
      if (idx < 0) throw new Error("Lead not found");
      const lead = store[idx]!;
      const now = new Date().toISOString();
      const updated: OnboardingLead = {
        ...lead,
        stage,
        updatedAt: now,
        history: [...lead.history, { at: now, stage }],
      };
      store = store.map((l) => (l.id === id ? updated : l));
      return delay(updated);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useReassignLeadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ownerId }: { id: string; ownerId: string }) => {
      const owner = ONBOARDING_OWNERS.find((o) => o.id === ownerId);
      if (!owner) throw new Error("Owner not found");
      const idx = store.findIndex((l) => l.id === id);
      if (idx < 0) throw new Error("Lead not found");
      const lead = store[idx]!;
      const now = new Date().toISOString();
      const updated: OnboardingLead = {
        ...lead,
        ownerId: owner.id,
        ownerRole: owner.role,
        ownerName: owner.name,
        updatedAt: now,
        history: [...lead.history, { at: now, stage: lead.stage, note: `Reassigned to ${owner.name}` }],
      };
      store = store.map((l) => (l.id === id ? updated : l));
      return delay(updated);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRejectLeadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const idx = store.findIndex((l) => l.id === id);
      if (idx < 0) throw new Error("Lead not found");
      const lead = store[idx]!;
      const now = new Date().toISOString();
      const updated: OnboardingLead = {
        ...lead,
        rejectionReason: reason,
        updatedAt: now,
        history: [...lead.history, { at: now, stage: lead.stage, note: `Rejected: ${reason}` }],
      };
      store = store.map((l) => (l.id === id ? updated : l));
      return delay(updated);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Convert a verified lead into an active client (mock). Returns the new ClientLite. */
export function useConvertLeadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<ClientLite> => {
      const lead = store.find((l) => l.id === id);
      if (!lead) throw new Error("Lead not found");
      const now = new Date().toISOString();
      const client: ClientLite = {
        id: `cli_${cryptoLikeId()}`,
        fullName: lead.fullName,
        email: lead.email,
        phoneMasked: lead.phone ? `+91 98•••••${lead.phone.slice(-3)}` : "+91 98•••••000",
        kycStatus: "verified",
        aum: 0,
        sipMonthly: 0,
        lastOrderAt: now,
        riskProfile: "Moderate",
        joinedAt: now,
      };
      RM_CLIENTS_FIXTURE.unshift(client);
      // advance lead stage
      store = store.map((l) =>
        l.id === id
          ? { ...l, stage: "first_invest" as LeadStage, updatedAt: now, history: [...l.history, { at: now, stage: "first_invest" as LeadStage, note: "Converted to client" }] }
          : l,
      );
      pushNotif({ category: "system", severity: "success", title: "Client created", body: `${lead.fullName} is now an active client.` });
      return delay(client);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["rm", "clients"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export { ONBOARDING_OWNERS };
