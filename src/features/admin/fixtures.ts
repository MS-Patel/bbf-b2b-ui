import type {
  AdminOverviewStats,
  CommissionRow,
  IntegrationHealth,
  IntegrationLog,
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
const ROLES: UserRole[] = ["investor", "investor", "investor", "investor", "investor", "rm", "distributor"];
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
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@wealthos.app`,
      role,
      kycStatus: KYC[Math.floor(r() * KYC.length)]!,
      status: STATUS[Math.floor(r() * STATUS.length)]!,
      joinedAt: joined.toISOString(),
      lastActiveAt: last.toISOString(),
      aum: role === "investor" ? Math.round(50_000 + r() * 8_000_000) : undefined,
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
