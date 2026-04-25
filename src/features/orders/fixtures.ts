import type { MandateLite, Order, OrderStatus, OrderType, SchemeLite } from "@/types/orders";
import { RM_CLIENTS_FIXTURE } from "@/features/rm/fixtures";

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export const SCHEMES_FIXTURE: SchemeLite[] = [
  { code: "PP_FLEXI_G", name: "Parag Parikh Flexi Cap — Direct Growth", amc: "PPFAS", category: "Equity – Flexi Cap", latestNav: 78.42, navAsOf: "2026-04-15", riskBand: "Very High", exitLoadDays: 365, cutoff: "15:00", minLumpSum: 1000, minSip: 1000 },
  { code: "AXIS_BLUE_G", name: "Axis Bluechip — Direct Growth", amc: "Axis MF", category: "Equity – Large Cap", latestNav: 64.18, navAsOf: "2026-04-15", riskBand: "Very High", exitLoadDays: 365, cutoff: "15:00", minLumpSum: 500, minSip: 500 },
  { code: "MIRAE_MID_G", name: "Mirae Asset Midcap — Direct Growth", amc: "Mirae", category: "Equity – Mid Cap", latestNav: 32.71, navAsOf: "2026-04-15", riskBand: "Very High", exitLoadDays: 365, cutoff: "15:00", minLumpSum: 5000, minSip: 1000 },
  { code: "QUANT_SMALL_G", name: "Quant Small Cap — Direct Growth", amc: "Quant MF", category: "Equity – Small Cap", latestNav: 240.12, navAsOf: "2026-04-15", riskBand: "Very High", exitLoadDays: 365, cutoff: "15:00", minLumpSum: 5000, minSip: 1000 },
  { code: "ICICI_LIQ_G", name: "ICICI Pru Liquid — Direct Growth", amc: "ICICI Pru", category: "Debt – Liquid", latestNav: 348.91, navAsOf: "2026-04-15", riskBand: "Low", exitLoadDays: 7, cutoff: "13:30", minLumpSum: 500, minSip: 500 },
  { code: "HDFC_CORP_G", name: "HDFC Corporate Bond — Direct Growth", amc: "HDFC MF", category: "Debt – Corporate Bond", latestNav: 28.56, navAsOf: "2026-04-15", riskBand: "Moderate", exitLoadDays: 0, cutoff: "15:00", minLumpSum: 5000, minSip: 1000 },
  { code: "SBI_GOLD_G", name: "SBI Gold — Direct Growth", amc: "SBI MF", category: "Gold", latestNav: 21.04, navAsOf: "2026-04-15", riskBand: "High", exitLoadDays: 0, cutoff: "15:00", minLumpSum: 1000, minSip: 500 },
  { code: "KOTAK_INTL_G", name: "Kotak Global Innovation — Direct Growth", amc: "Kotak MF", category: "International", latestNav: 18.27, navAsOf: "2026-04-15", riskBand: "Very High", exitLoadDays: 365, cutoff: "15:00", minLumpSum: 5000, minSip: 1000 },
  { code: "NIPPON_HYBRID_G", name: "Nippon India Equity Hybrid — Direct Growth", amc: "Nippon India", category: "Hybrid", latestNav: 92.55, navAsOf: "2026-04-15", riskBand: "High", exitLoadDays: 365, cutoff: "15:00", minLumpSum: 1000, minSip: 500 },
  { code: "DSP_TAXSAVER_G", name: "DSP Tax Saver — Direct Growth", amc: "DSP MF", category: "Equity – Flexi Cap", latestNav: 110.88, navAsOf: "2026-04-15", riskBand: "Very High", exitLoadDays: 0, cutoff: "15:00", minLumpSum: 500, minSip: 500 },
];

const STATUSES: OrderStatus[] = ["completed", "completed", "completed", "completed", "processing", "pending", "failed", "cancelled"];
const TYPES: OrderType[] = ["lump_sum", "lump_sum", "sip", "sip", "redeem", "switch"];
const PLACED_BY = [
  { id: "usr_rm_001", name: "Priya Nair", role: "rm" as const },
  { id: "usr_rm_002", name: "Karan Joshi", role: "rm" as const },
  { id: "usr_dist_001", name: "Rohan Kapoor", role: "distributor" as const },
  { id: "usr_dist_002", name: "Anita Shah", role: "distributor" as const },
  { id: "usr_admin_01", name: "Admin Desk", role: "admin" as const },
];

function buildOrders(): Order[] {
  const r = seeded(515);
  const out: Order[] = [];
  const today = new Date("2026-04-16");
  const eligible = RM_CLIENTS_FIXTURE.filter((c) => c.kycStatus === "verified");
  for (let i = 0; i < 90; i++) {
    const c = eligible[Math.floor(r() * eligible.length)]!;
    const sch = SCHEMES_FIXTURE[Math.floor(r() * SCHEMES_FIXTURE.length)]!;
    const type = TYPES[Math.floor(r() * TYPES.length)]!;
    const status = STATUSES[Math.floor(r() * STATUSES.length)]!;
    const placed = PLACED_BY[Math.floor(r() * PLACED_BY.length)]!;
    const placedAt = new Date(today);
    placedAt.setDate(today.getDate() - Math.floor(r() * 30));
    placedAt.setHours(10 + Math.floor(r() * 6), Math.floor(r() * 60));
    const amount =
      type === "sip"
        ? [1000, 2500, 5000, 10000, 25000][Math.floor(r() * 5)]!
        : type === "redeem"
          ? Math.round((5000 + r() * 95000) / 500) * 500
          : Math.round((5000 + r() * 195000) / 1000) * 1000;
    const nav = sch.latestNav;
    const units = +(amount / nav).toFixed(3);
    const order: Order = {
      id: `ord_${i.toString().padStart(4, "0")}`,
      clientId: c.id,
      clientName: c.fullName,
      type,
      status,
      schemeCode: sch.code,
      schemeName: sch.name,
      amc: sch.amc,
      amount,
      units,
      nav,
      folio: `${sch.amc.slice(0, 2).toUpperCase()}-${Math.floor(10000000 + r() * 89999999)}`,
      placedById: placed.id,
      placedByName: placed.name,
      placedByRole: placed.role,
      placedAt: placedAt.toISOString(),
      settledAt: status === "completed" ? new Date(placedAt.getTime() + 86_400_000).toISOString() : undefined,
      failureReason: status === "failed" ? "Payment gateway timeout — retry available" : undefined,
      consent: { investorConsent: true, riskAck: true, cutoffAck: true },
    };
    if (type === "sip") {
      order.sipFrequency = "monthly";
      order.sipDate = [1, 5, 10, 15, 20, 25][Math.floor(r() * 6)]!;
      order.sipTenureMonths = [12, 24, 36, 60, "perpetual" as const][Math.floor(r() * 5)]!;
      order.mandateId = `umrn_${Math.floor(100000 + r() * 899999)}`;
    }
    if (type === "switch") {
      const target = SCHEMES_FIXTURE[Math.floor(r() * SCHEMES_FIXTURE.length)]!;
      order.switchTargetCode = target.code;
      order.switchTargetName = target.name;
    }
    if (type === "redeem") {
      order.payoutBank = "HDFC Bank ••••2210";
    }
    out.push(order);
  }
  return out.sort((a, b) => +new Date(b.placedAt) - +new Date(a.placedAt));
}

export const ORDERS_FIXTURE: Order[] = buildOrders();

function buildMandates(): MandateLite[] {
  const out: MandateLite[] = [];
  const banks = ["HDFC Bank", "ICICI Bank", "Axis Bank", "SBI", "Kotak Mahindra"];
  RM_CLIENTS_FIXTURE.slice(0, 25).forEach((c, i) => {
    out.push({
      id: `umrn_${(100000 + i).toString()}`,
      clientId: c.id,
      umrn: `HDFC${(700000 + i).toString()}`,
      bank: `${banks[i % banks.length]} ••••${(2000 + i).toString().slice(-4)}`,
      maxAmount: [25000, 50000, 100000, 200000][i % 4]!,
      status: "active",
    });
  });
  return out;
}
export const MANDATES_FIXTURE: MandateLite[] = buildMandates();
