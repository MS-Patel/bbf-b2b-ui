import type { OnboardingDraft } from "./types";
import { REQUIRED_DOCUMENTS, OPTIONAL_DOCUMENTS } from "./constants";

export const MOCK_RMS = [
  { id: "rm_001", name: "Priya Nair", branchId: "br_mum_01" },
  { id: "rm_002", name: "Karan Joshi", branchId: "br_blr_02" },
  { id: "rm_003", name: "Meera Banerjee", branchId: "br_del_01" },
  { id: "rm_004", name: "Aditya Rao", branchId: "br_mum_01" },
];

export const MOCK_DISTRIBUTORS = [
  { id: "dist_001", name: "Kapoor Wealth Advisors", code: "KWA-2231", franchiseId: "fr_west" },
  { id: "dist_002", name: "Shah Capital Partners", code: "SCP-1109", franchiseId: "fr_south" },
  { id: "dist_003", name: "Northstar Financial", code: "NSF-5582", franchiseId: "fr_north" },
];

export const MOCK_BRANCHES = [
  { id: "br_mum_01", name: "Mumbai – Lower Parel", region: "West", franchiseId: "fr_west" },
  { id: "br_blr_02", name: "Bengaluru – Indiranagar", region: "South", franchiseId: "fr_south" },
  { id: "br_del_01", name: "Delhi – Connaught Place", region: "North", franchiseId: "fr_north" },
];

export const MOCK_FRANCHISES = [
  { id: "fr_west", name: "West Region Franchise" },
  { id: "fr_south", name: "South Region Franchise" },
  { id: "fr_north", name: "North Region Franchise" },
];

// Mock PAN lookup. Any PAN here returns "duplicate".
export const DUPLICATE_PANS = new Set(["ABCDE1234F", "XYZAB9876K"]);

// Mock IFSC lookup
export const MOCK_IFSC: Record<string, { bankName: string; branch: string }> = {
  HDFC0000123: { bankName: "HDFC Bank", branch: "Andheri East, Mumbai" },
  ICIC0000456: { bankName: "ICICI Bank", branch: "Indiranagar, Bengaluru" },
  SBIN0000789: { bankName: "State Bank of India", branch: "Connaught Place, Delhi" },
  AXIS0000321: { bankName: "Axis Bank", branch: "Bandra West, Mumbai" },
};

export function createEmptyDraft(): OnboardingDraft {
  const now = new Date().toISOString();
  return {
    draftId: `dft_${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    createdAt: now,
    identity: {
      pan: "",
      panLookupStatus: "idle",
      investorType: "individual",
      holdingType: "single",
      fullName: "",
      mobile: "",
      email: "",
      jointHolders: [],
    },
    kyc: {
      status: "pending",
      provider: "NDML",
      events: [
        {
          id: "evt_init",
          at: now,
          label: "Onboarding draft created",
          tone: "info",
          note: "KYC verification not yet initiated",
        },
      ],
      consentAck: false,
    },
    fatca: {
      residencies: [{ id: "res_1", country: "India", tin: "" }],
      classification: "individual",
      pep: false,
      usPerson: false,
      declarationAck: false,
    },
    banks: [],
    nominees: [],
    risk: { answers: {} },
    relationship: {},
    documents: [
      ...REQUIRED_DOCUMENTS.map((d) => ({ ...d, status: "missing" as const })),
      ...OPTIONAL_DOCUMENTS.map((d) => ({ ...d, status: "missing" as const })),
    ],
    consent: { termsAck: false, dataProcessingAck: false, declarationAck: false, marketingOptIn: false },
  };
}
