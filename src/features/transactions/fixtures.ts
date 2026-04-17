import type { Transaction, TransactionStatus, TransactionType } from "@/types/transaction";

const SCHEMES: Array<{ code: string; name: string; amc: string; folio: string }> = [
  { code: "PP_FLEXI_G", name: "Parag Parikh Flexi Cap — Direct Growth", amc: "PPFAS", folio: "PP-91823412" },
  { code: "AXIS_BLUE_G", name: "Axis Bluechip — Direct Growth", amc: "Axis MF", folio: "AX-77124908" },
  { code: "MIRAE_MID_G", name: "Mirae Asset Midcap — Direct Growth", amc: "Mirae", folio: "MR-44128820" },
  { code: "QUANT_SMALL_G", name: "Quant Small Cap — Direct Growth", amc: "Quant MF", folio: "QT-30219844" },
  { code: "ICICI_LIQ_G", name: "ICICI Pru Liquid — Direct Growth", amc: "ICICI Pru", folio: "IC-99008712" },
  { code: "HDFC_CORP_G", name: "HDFC Corporate Bond — Direct Growth", amc: "HDFC MF", folio: "HD-66432110" },
  { code: "SBI_GOLD_G", name: "SBI Gold — Direct Growth", amc: "SBI MF", folio: "SB-22788001" },
  { code: "KOTAK_INTL_G", name: "Kotak Global Innovation — Direct Growth", amc: "Kotak MF", folio: "KT-50912387" },
];

const TYPES: TransactionType[] = ["purchase", "sip", "redeem", "switch_in", "switch_out", "dividend"];
const STATUSES: TransactionStatus[] = ["completed", "completed", "completed", "completed", "pending", "processing", "failed"];

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function buildTransactions(): Transaction[] {
  const rand = seeded(99);
  const out: Transaction[] = [];
  const today = new Date("2026-04-16");
  for (let i = 0; i < 72; i++) {
    const sch = SCHEMES[Math.floor(rand() * SCHEMES.length)]!;
    const type = TYPES[Math.floor(rand() * TYPES.length)]!;
    const status = STATUSES[Math.floor(rand() * STATUSES.length)]!;
    const date = new Date(today);
    date.setDate(today.getDate() - Math.floor(rand() * 365));
    const nav = 25 + rand() * 600;
    const amount =
      type === "sip"
        ? [2500, 5000, 10000, 15000, 25000][Math.floor(rand() * 5)]!
        : type === "dividend"
          ? Math.round((500 + rand() * 4500) / 50) * 50
          : Math.round((5000 + rand() * 195000) / 1000) * 1000;
    const units = +(amount / nav).toFixed(3);
    out.push({
      id: `txn_${i.toString().padStart(4, "0")}`,
      date: date.toISOString(),
      type,
      status,
      schemeCode: sch.code,
      schemeName: sch.name,
      amc: sch.amc,
      folio: sch.folio,
      amount,
      units,
      nav: +nav.toFixed(4),
      orderId: `ORD${(800000 + i).toString()}`,
    });
  }
  return out.sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

export const TRANSACTIONS_FIXTURE: Transaction[] = buildTransactions();
