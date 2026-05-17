import type {
  Investor,
  InvestorAuditEntry,
  InvestorBank,
  InvestorDocument,
  InvestorNominee,
  InvestorRelationship,
  InvestorSIP,
  InvestorStatus,
  InvestorTxnLite,
  RiskProfile,
  FatcaStatus,
  NomineeStatus,
} from "./types";
import type { KycStatusLite } from "@/types/admin";

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

const FIRST = ["Aarav", "Saanvi", "Vivaan", "Anaya", "Reyansh", "Diya", "Krishna", "Kiara", "Arjun", "Myra", "Rohan", "Ishita", "Kabir", "Sara", "Aryan", "Riya", "Aditi", "Neil", "Tara", "Veer"];
const LAST = ["Mehta", "Iyer", "Sharma", "Khanna", "Bose", "Reddy", "Patel", "Nair", "Verma", "Gupta", "Chopra", "Bhat", "Pillai"];
const CITIES: Array<[string, string]> = [
  ["Mumbai", "MH"], ["Bengaluru", "KA"], ["Delhi", "DL"], ["Pune", "MH"], ["Chennai", "TN"],
  ["Hyderabad", "TG"], ["Kolkata", "WB"], ["Ahmedabad", "GJ"], ["Gurugram", "HR"],
];
const RMS = ["Priya Subramanian", "Karan Joshi", "Meera Pillai", "Ankit Bhatia"];
const DISTRIBUTORS = ["WealthBridge Advisors", "Northstar Capital", "Bluepeak Finserv", "Apex Money Partners"];
const FAMILIES = [undefined, "Mehta Family", "Iyer Family", "Sharma Family", undefined, undefined];
const KYC: KycStatusLite[] = ["verified", "verified", "verified", "verified", "pending", "rejected", "not_started"];
const FATCA: FatcaStatus[] = ["declared", "declared", "pending", "exempt"];
const NOM: NomineeStatus[] = ["registered", "registered", "registered", "missing", "rejected"];
const RISK: RiskProfile[] = ["Conservative", "Moderate", "Moderate", "Aggressive"];
const SCHEMES = [
  "HDFC Flexi Cap Fund — Direct Growth",
  "Axis Bluechip Fund — Direct Growth",
  "Parag Parikh Flexi Cap — Direct Growth",
  "Mirae Asset Large Cap — Direct Growth",
  "ICICI Pru Balanced Advantage — Direct Growth",
  "SBI Small Cap Fund — Direct Growth",
];

function buildBanks(r: () => number): InvestorBank[] {
  const banks: InvestorBank[] = [{
    bankName: ["HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra"][Math.floor(r() * 4)]!,
    accountMasked: `XXXX${Math.floor(1000 + r() * 8999)}`,
    ifsc: `HDFC000${Math.floor(1000 + r() * 8999)}`,
    primary: true,
    verifiedAt: new Date(Date.now() - Math.floor(r() * 365) * 86400000).toISOString(),
  }];
  if (r() > 0.6) {
    banks.push({
      bankName: "SBI", accountMasked: `XXXX${Math.floor(1000 + r() * 8999)}`,
      ifsc: `SBIN000${Math.floor(1000 + r() * 8999)}`, primary: false,
      verifiedAt: new Date(Date.now() - Math.floor(r() * 365) * 86400000).toISOString(),
    });
  }
  return banks;
}

function buildNominees(r: () => number): InvestorNominee[] {
  const count = Math.floor(r() * 3); // 0-2
  const rels = ["Spouse", "Child", "Parent", "Sibling"];
  const names = ["Anjali", "Rahul", "Sunita", "Vikram"];
  const out: InvestorNominee[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      id: `nom_${i}`, name: names[i]!, relation: rels[i]!,
      sharePct: count === 1 ? 100 : count === 2 ? 50 : Math.round(100 / count),
      dob: new Date(1980 + Math.floor(r() * 30), Math.floor(r() * 12), 1 + Math.floor(r() * 27)).toISOString(),
    });
  }
  return out;
}

function buildDocuments(r: () => number): InvestorDocument[] {
  const types: InvestorDocument["type"][] = ["PAN", "Aadhaar", "Bank Proof", "Address Proof", "Cancelled Cheque", "FATCA", "Signature"];
  return types.map((t, i) => {
    const ok = r();
    const status: InvestorDocument["status"] = ok > 0.85 ? "rejected" : ok > 0.7 ? "pending" : "verified";
    return {
      id: `doc_${i}`, type: t,
      fileName: `${t.toLowerCase().replace(/\s/g, "_")}.pdf`,
      status,
      uploadedAt: new Date(Date.now() - Math.floor(r() * 200) * 86400000).toISOString(),
    };
  });
}

function buildTxns(r: () => number): InvestorTxnLite[] {
  const out: InvestorTxnLite[] = [];
  const types: InvestorTxnLite["type"][] = ["Purchase", "SIP", "Redemption", "Switch", "Purchase", "SIP"];
  for (let i = 0; i < 6; i++) {
    out.push({
      id: `txn_${i}`,
      date: new Date(Date.now() - i * 18 * 86400000).toISOString(),
      scheme: SCHEMES[Math.floor(r() * SCHEMES.length)]!,
      type: types[i]!,
      amount: Math.round(5000 + r() * 245000),
      units: Math.round(r() * 1000 * 100) / 100,
      status: r() > 0.9 ? "failed" : r() > 0.75 ? "pending" : "settled",
    });
  }
  return out;
}

function buildSIPs(r: () => number, monthly: number): InvestorSIP[] {
  if (monthly === 0) return [];
  const out: InvestorSIP[] = [];
  const count = 1 + Math.floor(r() * 2);
  for (let i = 0; i < count; i++) {
    out.push({
      id: `sip_${i}`,
      scheme: SCHEMES[Math.floor(r() * SCHEMES.length)]!,
      amount: Math.round(monthly / count),
      frequency: "Monthly",
      nextDebit: new Date(Date.now() + (5 + i * 3) * 86400000).toISOString(),
      status: r() > 0.85 ? "paused" : "active",
    });
  }
  return out;
}

function buildRelationships(rm: string, dist: string, family: string | undefined): InvestorRelationship[] {
  const out: InvestorRelationship[] = [
    { id: "r_rm", name: rm, role: "RM", meta: "Primary contact", since: "2023-08-12" },
    { id: "r_dist", name: dist, role: "Distributor", meta: "ARN-89124", since: "2023-08-12" },
  ];
  if (family) {
    out.push({ id: "r_fam", name: family, role: "Family Head", meta: "3 members", since: "2024-02-01" });
  }
  return out;
}

function buildAudit(r: () => number, name: string): InvestorAuditEntry[] {
  return [
    { id: "a1", at: new Date(Date.now() - 2 * 86400000).toISOString(), actor: "Priya Subramanian (RM)", action: "Updated risk profile", field: "riskProfile", before: "Conservative", after: "Moderate" },
    { id: "a2", at: new Date(Date.now() - 7 * 86400000).toISOString(), actor: "Compliance Bot", action: "FATCA declaration re-validated" },
    { id: "a3", at: new Date(Date.now() - 18 * 86400000).toISOString(), actor: name, action: "Added secondary bank account" },
    { id: "a4", at: new Date(Date.now() - 35 * 86400000).toISOString(), actor: "Admin · operations", action: "Investor onboarded", field: "status", before: "onboarding", after: "active" },
  ];
}

function buildInvestor(i: number, r: () => number): Investor {
  const fn = FIRST[Math.floor(r() * FIRST.length)]!;
  const ln = LAST[Math.floor(r() * LAST.length)]!;
  const [city, state] = CITIES[Math.floor(r() * CITIES.length)]!;
  const rm = RMS[Math.floor(r() * RMS.length)]!;
  const dist = DISTRIBUTORS[Math.floor(r() * DISTRIBUTORS.length)]!;
  const family = FAMILIES[Math.floor(r() * FAMILIES.length)];
  const status: InvestorStatus = r() > 0.92 ? "suspended" : r() > 0.85 ? "dormant" : r() > 0.78 ? "onboarding" : "active";
  const sipMonthly = [0, 0, 5000, 10000, 15000, 25000, 50000, 100000][Math.floor(r() * 8)]!;
  const aum = Math.round(120_000 + r() * 18_000_000);
  const joined = new Date("2026-04-16");
  joined.setDate(joined.getDate() - Math.floor(r() * 900));
  const lastOrder = new Date("2026-04-16");
  lastOrder.setDate(lastOrder.getDate() - Math.floor(r() * 90));
  const dob = new Date(1965 + Math.floor(r() * 40), Math.floor(r() * 12), 1 + Math.floor(r() * 27));
  const name = `${fn} ${ln}`;
  return {
    id: `inv_${i.toString().padStart(5, "0")}`,
    folioNo: `${Math.floor(1000000 + r() * 8999999)}`,
    pan: `${String.fromCharCode(65 + Math.floor(r() * 26))}${String.fromCharCode(65 + Math.floor(r() * 26))}${String.fromCharCode(65 + Math.floor(r() * 26))}P${String.fromCharCode(65 + Math.floor(r() * 26))}${Math.floor(1000 + r() * 8999)}A`,
    fullName: name,
    email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@example.in`,
    phoneMasked: `+91 98•••••${Math.floor(100 + r() * 899)}`,
    status,
    kycStatus: KYC[Math.floor(r() * KYC.length)]!,
    fatca: FATCA[Math.floor(r() * FATCA.length)]!,
    nomineeStatus: NOM[Math.floor(r() * NOM.length)]!,
    riskProfile: RISK[Math.floor(r() * RISK.length)]!,
    aum,
    sipMonthly,
    joinedAt: joined.toISOString(),
    lastOrderAt: lastOrder.toISOString(),
    city, state,
    rmName: rm,
    distributorName: dist,
    familyGroup: family,
    dob: dob.toISOString(),
    address: `${Math.floor(1 + r() * 250)}, ${["Lake View", "Hill Crest", "Marine Drive", "Park Avenue"][Math.floor(r() * 4)]}, ${city}, ${state}`,
    banks: buildBanks(r),
    nominees: buildNominees(r),
    documents: buildDocuments(r),
    relationships: buildRelationships(rm, dist, family),
    transactions: buildTxns(r),
    sips: buildSIPs(r, sipMonthly),
    audit: buildAudit(r, name),
  };
}

function buildAll(): Investor[] {
  const r = seeded(2027);
  const out: Investor[] = [];
  for (let i = 0; i < 64; i++) out.push(buildInvestor(i, r));
  return out;
}

export const INVESTORS_FIXTURE: Investor[] = buildAll();
