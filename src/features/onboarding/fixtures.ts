import type { KycChecklist, LeadSource, LeadStage, OnboardingLead, OwnerRole } from "./types";

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

const FIRST = ["Aarav", "Saanvi", "Vivaan", "Anaya", "Reyansh", "Diya", "Krishna", "Kiara", "Arjun", "Myra", "Rohan", "Ishita", "Kabir", "Sara", "Aryan", "Riya", "Tara", "Veer"];
const LAST = ["Mehta", "Iyer", "Sharma", "Khanna", "Bose", "Reddy", "Patel", "Nair", "Verma", "Gupta"];
const STAGES: LeadStage[] = ["lead", "kyc_started", "kyc_in_review", "verified", "first_invest"];
const SOURCES: LeadSource[] = ["Referral", "Website", "Campaign", "RM Direct"];

interface OwnerSeed {
  id: string;
  role: OwnerRole;
  name: string;
}

export const ONBOARDING_OWNERS: OwnerSeed[] = [
  { id: "usr_rm_001", role: "rm", name: "Priya Nair" },
  { id: "usr_rm_002", role: "rm", name: "Karan Joshi" },
  { id: "usr_rm_003", role: "rm", name: "Meera Banerjee" },
  { id: "usr_dist_001", role: "distributor", name: "Rohan Kapoor" },
  { id: "usr_dist_002", role: "distributor", name: "Anita Shah" },
];

function checklistFor(stage: LeadStage, r: () => number): KycChecklist {
  const base: KycChecklist = {
    pan: "pending", aadhaar: "pending", bank: "pending", nominee: "pending", fatca: "pending", esign: "pending",
  };
  if (stage === "lead") return base;
  if (stage === "kyc_started") {
    return { ...base, pan: "submitted", aadhaar: r() > 0.5 ? "submitted" : "pending" };
  }
  if (stage === "kyc_in_review") {
    return { pan: "submitted", aadhaar: "submitted", bank: "submitted", nominee: r() > 0.4 ? "submitted" : "pending", fatca: "submitted", esign: r() > 0.5 ? "submitted" : "pending" };
  }
  // verified or first_invest
  return { pan: "verified", aadhaar: "verified", bank: "verified", nominee: "verified", fatca: "verified", esign: "verified" };
}

function buildLeads(): OnboardingLead[] {
  const r = seeded(202);
  const out: OnboardingLead[] = [];
  for (let i = 0; i < 32; i++) {
    const fn = FIRST[Math.floor(r() * FIRST.length)]!;
    const ln = LAST[Math.floor(r() * LAST.length)]!;
    const owner = ONBOARDING_OWNERS[Math.floor(r() * ONBOARDING_OWNERS.length)]!;
    const stage = STAGES[Math.floor(r() * STAGES.length)]!;
    const created = new Date("2026-04-16");
    created.setDate(created.getDate() - Math.floor(r() * 30));
    const updated = new Date(created);
    updated.setDate(updated.getDate() + Math.floor(r() * 5));
    out.push({
      id: `ld_${i.toString().padStart(4, "0")}`,
      fullName: `${fn} ${ln}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@lead.in`,
      phone: `+91 9${Math.floor(100000000 + r() * 899999999)}`.slice(0, 14),
      pan: r() > 0.4 ? `ABCDE${Math.floor(1000 + r() * 8999)}F` : undefined,
      stage,
      source: SOURCES[Math.floor(r() * SOURCES.length)]!,
      ownerId: owner.id,
      ownerRole: owner.role,
      ownerName: owner.name,
      kycChecklist: checklistFor(stage, r),
      inviteSentAt: created.toISOString(),
      inviteLink: `https://buybestfin.app/invite/${cryptoLikeId(r)}`,
      createdAt: created.toISOString(),
      updatedAt: updated.toISOString(),
      history: [
        { at: created.toISOString(), stage: "lead", note: "Lead captured" },
        ...(stage !== "lead" ? [{ at: updated.toISOString(), stage }] : []),
      ],
    });
  }
  return out;
}

function cryptoLikeId(r: () => number): string {
  return Array.from({ length: 12 }, () => Math.floor(r() * 36).toString(36)).join("");
}

export const ONBOARDING_LEADS_FIXTURE: OnboardingLead[] = buildLeads();
