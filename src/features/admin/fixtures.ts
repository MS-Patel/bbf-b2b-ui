import type {
  AdminOverviewStats,
  AMCMaster,
  Branch,
  BrokerageImport,
  CommissionRow,
  DistributorCategory,
  DistributorProfile,
  IntegrationHealth,
  IntegrationLog,
  InvestorDistributorMapping,
  PayoutCycleSummary,
  RmMapping,
  RmProfile,
  MasterUploadRun,
  PayoutRun,
  PlatformUser,
} from "@/types/admin";
import type { UserRole } from "@/types/auth";

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

const FIRST = ["Aarav", "Saanvi", "Vivaan", "Anaya", "Reyansh", "Diya", "Krishna", "Kiara", "Arjun", "Myra", "Rohan", "Ishita", "Kabir", "Sara", "Aryan", "Riya", "Dev", "Aanya", "Yash", "Tara"];
const LAST = ["Mehta", "Iyer", "Sharma", "Khanna", "Bose", "Reddy", "Patel", "Nair", "Verma", "Gupta", "Kapoor", "Singh", "Rao", "Joshi", "Bhatt"];
const ROLES: UserRole[] = ["rm", "rm", "rm", "distributor", "distributor", "admin"];
const KYC = ["verified", "verified", "verified", "pending", "rejected", "not_started"] as const;
const STATUS = ["active", "active", "active", "suspended", "invited"] as const;

function buildUsers(): PlatformUser[] {
  const r = seeded(2026);
  const out: PlatformUser[] = [];
  for (let i = 0; i < 84; i++) {
    const fn = FIRST[Math.floor(r() * FIRST.length)]!;
    const ln = LAST[Math.floor(r() * LAST.length)]!;
    const role = ROLES[Math.floor(r() * ROLES.length)]!;
    const joinedDays = Math.floor(r() * 800);
    const joined = new Date("2026-04-16");
    joined.setDate(joined.getDate() - joinedDays);
    const lastDays = Math.floor(r() * 30);
    const last = new Date("2026-04-16");
    last.setDate(last.getDate() - lastDays);
    out.push({
      id: `usr_${i.toString().padStart(4, "0")}`,
      fullName: `${fn} ${ln}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@buybestfin.app`,
      role,
      kycStatus: KYC[Math.floor(r() * KYC.length)]!,
      status: STATUS[Math.floor(r() * STATUS.length)]!,
      joinedAt: joined.toISOString(),
      lastActiveAt: last.toISOString(),
      aum: role === "distributor" || role === "rm" ? Math.round(5_000_000 + r() * 200_000_000) : undefined,
    });
  }
  return out;
}

export const PLATFORM_USERS: PlatformUser[] = buildUsers();

export const INTEGRATIONS_FIXTURE: IntegrationHealth[] = [
  { name: "BSE Star MF", status: "operational", uptime: 99.94, latencyMs: 312, lastCheck: "2026-04-16T09:42:00Z" },
  { name: "NDML KYC", status: "operational", uptime: 99.71, latencyMs: 540, lastCheck: "2026-04-16T09:41:30Z" },
  { name: "CAMS RTA", status: "degraded", uptime: 97.10, latencyMs: 1280, lastCheck: "2026-04-16T09:40:14Z" },
  { name: "Karvy RTA", status: "operational", uptime: 99.40, latencyMs: 470, lastCheck: "2026-04-16T09:42:11Z" },
];

export const INTEGRATION_LOGS_FIXTURE: IntegrationLog[] = [
  { id: "log_01", integration: "CAMS RTA", level: "warn", message: "Mailback parser retry succeeded after 2 attempts (mb_2026_04_16_002.zip).", at: "2026-04-16T09:34:00Z" },
  { id: "log_02", integration: "BSE Star MF", level: "info", message: "Order batch BCH-77821 acknowledged (3,214 orders).", at: "2026-04-16T09:30:00Z" },
  { id: "log_03", integration: "NDML KYC", level: "error", message: "Aadhaar OTP timeout for ref NDML-77123 — investor retried successfully.", at: "2026-04-16T08:51:00Z" },
  { id: "log_04", integration: "Karvy RTA", level: "info", message: "Folio sync delta processed: 412 updates.", at: "2026-04-16T08:30:00Z" },
  { id: "log_05", integration: "BSE Star MF", level: "info", message: "NAV file ingested for 2026-04-15 (2,944 schemes).", at: "2026-04-16T07:12:00Z" },
  { id: "log_06", integration: "CAMS RTA", level: "warn", message: "Latency above threshold (1.4s avg) — auto-throttled.", at: "2026-04-16T06:55:00Z" },
];

const RM_NAMES = ["Priya Khanna", "Rahul Bose", "Neha Iyer", "Vikram Reddy", "Aditi Sharma", "Manish Patel"];
const DIST_NAMES = ["Equirus Wealth", "Anand Rathi", "Motilal Oswal", "ICICI Direct"];

function buildCommissions(): CommissionRow[] {
  const r = seeded(7);
  const cats = ["Equity", "Debt", "Hybrid", "Gold"];
  const cycles = ["Mar 2026", "Feb 2026", "Jan 2026"];
  const out: CommissionRow[] = [];
  let id = 0;
  for (const cycle of cycles) {
    for (const name of [...RM_NAMES, ...DIST_NAMES]) {
      const role = RM_NAMES.includes(name) ? "rm" : "distributor";
      for (const cat of cats) {
        const aum = Math.round(5_000_000 + r() * 80_000_000);
        const trail = +(0.4 + r() * 0.9).toFixed(2);
        const earned = Math.round((aum * trail) / 100 / 12);
        out.push({
          id: `cm_${(id++).toString().padStart(4, "0")}`,
          payee: name,
          payeeRole: role,
          schemeCategory: cat,
          aum,
          trailRate: trail,
          earned,
          cycle,
        });
      }
    }
  }
  return out;
}
export const COMMISSIONS_FIXTURE: CommissionRow[] = buildCommissions();

function buildPayouts(): PayoutRun[] {
  const r = seeded(13);
  const cycles = ["Apr 2026", "Mar 2026", "Feb 2026", "Jan 2026"];
  const statuses = ["processed", "processed", "processed", "pending", "scheduled", "failed"] as const;
  const all = [...RM_NAMES.map((n) => ({ name: n, role: "rm" as const })), ...DIST_NAMES.map((n) => ({ name: n, role: "distributor" as const }))];
  const out: PayoutRun[] = [];
  let id = 0;
  for (const cycle of cycles) {
    for (const b of all) {
      const status = statuses[Math.floor(r() * statuses.length)]!;
      const created = new Date(`2026-${(cycles.indexOf(cycle) + 1).toString().padStart(2, "0")}-05`);
      const amount = Math.round(80_000 + r() * 1_800_000);
      out.push({
        id: `po_${(id++).toString().padStart(4, "0")}`,
        cycle,
        beneficiary: b.name,
        beneficiaryRole: b.role,
        amount,
        status,
        createdAt: created.toISOString(),
        processedAt: status === "processed" ? new Date(created.getTime() + 86400000 * 2).toISOString() : undefined,
      });
    }
  }
  return out;
}
export const PAYOUTS_FIXTURE: PayoutRun[] = buildPayouts();

function buildAdminOverview(): AdminOverviewStats {
  const r = seeded(31);
  const today = new Date("2026-04-16");
  const ordersTrend = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (29 - i));
    return { date: d.toISOString(), orders: Math.round(2200 + r() * 1800 + (i > 22 ? 600 : 0)) };
  });
  return {
    totalAum: 24_000_000_000,
    activeInvestors: 12_847,
    ordersToday: 3_214,
    kycPending: 186,
    ordersTrend,
    aumByAsset: [
      { name: "Equity", value: 14_400_000_000 },
      { name: "Debt", value: 5_600_000_000 },
      { name: "Hybrid", value: 2_800_000_000 },
      { name: "Gold", value: 1_200_000_000 },
    ],
  };
}
export const ADMIN_OVERVIEW_FIXTURE: AdminOverviewStats = buildAdminOverview();

export const BRANCHES_FIXTURE: Branch[] = [
  { id: "br_mum_001", code: "MUM-CEN", name: "Mumbai Central", city: "Mumbai", state: "Maharashtra", manager: "Aditi Sharma", rmCount: 18, distributorCount: 42, status: "active", updatedAt: "2026-04-16T08:30:00Z" },
  { id: "br_del_001", code: "DEL-NCR", name: "Delhi NCR", city: "New Delhi", state: "Delhi", manager: "Rahul Bose", rmCount: 15, distributorCount: 35, status: "active", updatedAt: "2026-04-15T13:10:00Z" },
  { id: "br_blr_001", code: "BLR-SOU", name: "Bengaluru South", city: "Bengaluru", state: "Karnataka", manager: "Neha Iyer", rmCount: 12, distributorCount: 28, status: "active", updatedAt: "2026-04-14T16:45:00Z" },
  { id: "br_pun_001", code: "PUN-WST", name: "Pune West", city: "Pune", state: "Maharashtra", manager: "Vikram Reddy", rmCount: 9, distributorCount: 21, status: "inactive", updatedAt: "2026-04-12T09:20:00Z" },
];

export const MASTER_UPLOADS_FIXTURE: MasterUploadRun[] = [
  { id: "upl_001", type: "navs", fileName: "nav_2026_04_15.csv", uploadedBy: "Ops Admin", uploadedAt: "2026-04-16T07:12:00Z", records: 2944, errors: 0, status: "processed" },
  { id: "upl_002", type: "schemes", fileName: "scheme_master_apr.csv", uploadedBy: "Ops Admin", uploadedAt: "2026-04-15T18:45:00Z", records: 1842, errors: 6, status: "processed" },
  { id: "upl_003", type: "navs", fileName: "nav_2026_04_14.csv", uploadedBy: "System", uploadedAt: "2026-04-15T07:05:00Z", records: 2938, errors: 0, status: "processed" },
  { id: "upl_004", type: "schemes", fileName: "new_fund_offers.csv", uploadedBy: "Ops Admin", uploadedAt: "2026-04-16T09:10:00Z", records: 24, errors: 1, status: "processing" },
];

export const AMC_MASTER_FIXTURE: AMCMaster[] = [
  { id: "amc_hdfc", code: "HDFC", name: "HDFC Mutual Fund", registrar: "CAMS", activeSchemes: 168, lastNavAt: "2026-04-15T18:30:00Z", status: "active" },
  { id: "amc_sbi", code: "SBI", name: "SBI Mutual Fund", registrar: "CAMS", activeSchemes: 192, lastNavAt: "2026-04-15T18:28:00Z", status: "active" },
  { id: "amc_icici", code: "ICICI", name: "ICICI Prudential Mutual Fund", registrar: "CAMS", activeSchemes: 214, lastNavAt: "2026-04-15T18:24:00Z", status: "active" },
  { id: "amc_axis", code: "AXIS", name: "Axis Mutual Fund", registrar: "KFintech", activeSchemes: 126, lastNavAt: "2026-04-15T18:20:00Z", status: "active" },
  { id: "amc_quant", code: "QUANT", name: "Quant Mutual Fund", registrar: "Karvy", activeSchemes: 76, lastNavAt: "2026-04-14T18:15:00Z", status: "paused" },
];

export const DISTRIBUTORS_FIXTURE: DistributorProfile[] = [
  { id: "dist_001", name: "Equirus Wealth", arn: "ARN-148922", email: "ops@equiruswealth.in", phone: "+91 98765 43001", city: "Mumbai", state: "Maharashtra", branchId: "br_mum_001", branchName: "Mumbai Central", rmOwnerId: "rm_001", rmOwnerName: "Priya Khanna", clientCount: 486, rmCount: 8, aum: 840_000_000, status: "active", joinedAt: "2024-08-12T10:20:00Z", updatedAt: "2026-04-14T11:30:00Z" },
  { id: "dist_002", name: "Anand Rathi Partner Desk", arn: "ARN-073421", email: "partners@arwealth.in", phone: "+91 98765 43002", city: "New Delhi", state: "Delhi", branchId: "br_del_001", branchName: "Delhi NCR", rmOwnerId: "rm_002", rmOwnerName: "Rahul Bose", clientCount: 352, rmCount: 6, aum: 620_000_000, status: "active", joinedAt: "2024-11-02T09:10:00Z", updatedAt: "2026-04-13T15:45:00Z" },
  { id: "dist_003", name: "Bengaluru Alpha Advisors", arn: "ARN-225870", email: "support@alphaadvisors.in", phone: "+91 98765 43003", city: "Bengaluru", state: "Karnataka", branchId: "br_blr_001", branchName: "Bengaluru South", rmOwnerId: "rm_003", rmOwnerName: "Neha Iyer", clientCount: 298, rmCount: 5, aum: 510_000_000, status: "pending", joinedAt: "2025-03-18T12:00:00Z", updatedAt: "2026-04-16T07:30:00Z" },
  { id: "dist_004", name: "Pune Growth Capital", arn: "ARN-992104", email: "desk@punegrowth.in", phone: "+91 98765 43004", city: "Pune", state: "Maharashtra", branchId: "br_pun_001", branchName: "Pune West", rmOwnerId: "rm_004", rmOwnerName: "Vikram Reddy", clientCount: 174, rmCount: 3, aum: 280_000_000, status: "suspended", joinedAt: "2025-07-21T08:45:00Z", updatedAt: "2026-04-10T10:05:00Z" },
];

export const RMS_FIXTURE: RmProfile[] = [
  { id: "rm_001", name: "Priya Khanna", employeeCode: "RM-MUM-014", email: "priya.khanna@buybestfin.app", phone: "+91 98765 44001", branchId: "br_mum_001", branchName: "Mumbai Central", distributorIds: ["dist_001"], distributorNames: ["Equirus Wealth"], clientCount: 248, aum: 420_000_000, status: "active", joinedAt: "2023-06-11T09:00:00Z", updatedAt: "2026-04-15T09:30:00Z" },
  { id: "rm_002", name: "Rahul Bose", employeeCode: "RM-DEL-008", email: "rahul.bose@buybestfin.app", phone: "+91 98765 44002", branchId: "br_del_001", branchName: "Delhi NCR", distributorIds: ["dist_002"], distributorNames: ["Anand Rathi Partner Desk"], clientCount: 216, aum: 360_000_000, status: "active", joinedAt: "2023-09-04T09:00:00Z", updatedAt: "2026-04-14T14:30:00Z" },
  { id: "rm_003", name: "Neha Iyer", employeeCode: "RM-BLR-021", email: "neha.iyer@buybestfin.app", phone: "+91 98765 44003", branchId: "br_blr_001", branchName: "Bengaluru South", distributorIds: ["dist_003"], distributorNames: ["Bengaluru Alpha Advisors"], clientCount: 184, aum: 318_000_000, status: "active", joinedAt: "2024-02-19T09:00:00Z", updatedAt: "2026-04-15T16:10:00Z" },
  { id: "rm_004", name: "Vikram Reddy", employeeCode: "RM-PUN-006", email: "vikram.reddy@buybestfin.app", phone: "+91 98765 44004", branchId: "br_pun_001", branchName: "Pune West", distributorIds: ["dist_004"], distributorNames: ["Pune Growth Capital"], clientCount: 122, aum: 190_000_000, status: "pending", joinedAt: "2024-12-03T09:00:00Z", updatedAt: "2026-04-16T08:40:00Z" },
];

export const INVESTOR_DISTRIBUTOR_MAPPINGS_FIXTURE: InvestorDistributorMapping[] = PLATFORM_USERS.slice(0, 18).map((u, i) => {
  const dist = DISTRIBUTORS_FIXTURE[i % DISTRIBUTORS_FIXTURE.length]!;
  const rm = RMS_FIXTURE[i % RMS_FIXTURE.length]!;
  return { id: `map_inv_${i.toString().padStart(3, "0")}`, investorName: u.fullName, investorEmail: u.email, distributorId: dist.id, distributorName: dist.name, rmId: rm.id, rmName: rm.name, branchId: rm.branchId, branchName: rm.branchName, status: i % 5 === 0 ? "review" : i % 4 === 0 ? "pending" : "active", mappedAt: u.joinedAt };
});

export const RM_MAPPINGS_FIXTURE: RmMapping[] = RMS_FIXTURE.map((rm, i) => ({
  id: `map_rm_${i.toString().padStart(3, "0")}`,
  rmId: rm.id,
  rmName: rm.name,
  branchId: rm.branchId,
  branchName: rm.branchName,
  distributorIds: rm.distributorIds,
  distributorNames: rm.distributorNames,
  status: i === 3 ? "pending" : "active",
  updatedAt: rm.updatedAt,
}));

export const BROKERAGE_IMPORTS_FIXTURE: BrokerageImport[] = (() => {
  const r = seeded(91);
  const sources = ["BSE", "NSE", "CAMS", "Karvy"] as const;
  const statuses = ["processed", "processed", "processed", "processed", "processing", "failed"] as const;
  const uploaders = ["Ops Admin", "System", "Finance Bot", "Reconciliation Bot"];
  const out: BrokerageImport[] = [];
  for (let i = 0; i < 22; i++) {
    const src = sources[Math.floor(r() * sources.length)]!;
    const status = statuses[Math.floor(r() * statuses.length)]!;
    const d = new Date("2026-04-16");
    d.setDate(d.getDate() - Math.floor(r() * 90));
    const records = Math.round(800 + r() * 7200);
    const errors = status === "failed" ? Math.round(40 + r() * 200) : status === "processing" ? 0 : Math.round(r() * 12);
    out.push({
      id: `bk_${i.toString().padStart(4, "0")}`,
      fileName: `${src.toLowerCase()}_brokerage_${d.toISOString().slice(0, 10).replace(/-/g, "")}.csv`,
      source: src,
      uploadedBy: uploaders[Math.floor(r() * uploaders.length)]!,
      importedAt: d.toISOString(),
      records,
      errors,
      amount: Math.round(250_000 + r() * 18_000_000),
      status,
    });
  }
  return out.sort((a, b) => b.importedAt.localeCompare(a.importedAt));
})();

export const DISTRIBUTOR_CATEGORIES_FIXTURE: DistributorCategory[] = [
  { id: "dc_pt", name: "Platinum", minAum: 500_000_000, maxAum: null, baseTrailPct: 1.10, bonusTrailPct: 0.25, distributorCount: 12, effectiveFrom: "2025-04-01", status: "active", updatedAt: "2026-03-12T10:00:00Z" },
  { id: "dc_gd", name: "Gold", minAum: 200_000_000, maxAum: 500_000_000, baseTrailPct: 0.90, bonusTrailPct: 0.15, distributorCount: 38, effectiveFrom: "2025-04-01", status: "active", updatedAt: "2026-03-12T10:00:00Z" },
  { id: "dc_sl", name: "Silver", minAum: 50_000_000, maxAum: 200_000_000, baseTrailPct: 0.70, bonusTrailPct: 0.10, distributorCount: 86, effectiveFrom: "2025-04-01", status: "active", updatedAt: "2026-03-12T10:00:00Z" },
  { id: "dc_bz", name: "Bronze", minAum: 0, maxAum: 50_000_000, baseTrailPct: 0.50, bonusTrailPct: 0.00, distributorCount: 142, effectiveFrom: "2025-04-01", status: "active", updatedAt: "2026-03-12T10:00:00Z" },
];

export const PAYOUT_CYCLE_SUMMARIES_FIXTURE: PayoutCycleSummary[] = (() => {
  const r = seeded(53);
  const cycles = ["Nov 2025", "Dec 2025", "Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026"];
  return cycles.map((cycle, i) => {
    const base = 14_000_000 + i * 1_400_000 + r() * 2_000_000;
    const platinum = Math.round(base * 0.42);
    const gold = Math.round(base * 0.30);
    const silver = Math.round(base * 0.20);
    const bronze = Math.round(base * 0.08);
    const total = platinum + gold + silver + bronze;
    return {
      cycle,
      totalPayouts: total,
      brokerageImported: Math.round(total * (1.18 + r() * 0.08)),
      byCategory: [
        { category: "Platinum", amount: platinum },
        { category: "Gold", amount: gold },
        { category: "Silver", amount: silver },
        { category: "Bronze", amount: bronze },
      ],
    };
  });
})();
