import type { ReportHistoryRow, ReportType, ReportFormat, ReportStatus } from "./types";

const TYPES: ReportType[] = ["wealth", "pl", "capital_gains", "transaction", "holding"];
const FORMATS: ReportFormat[] = ["pdf", "excel", "csv"];
const STATUSES: ReportStatus[] = ["ready", "ready", "ready", "processing", "failed"];
const CLIENTS = ["Aarav Mehta", "Saanvi Iyer", "Vivaan Sharma", "Anaya Khanna", "Reyansh Bose", "Diya Reddy", "Krishna Patel", "Kiara Nair", "Arjun Verma", "Myra Gupta"];

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export function buildReportsHistory(seed: number, by: string): ReportHistoryRow[] {
  const r = seeded(seed);
  const base = new Date("2026-04-16");
  return Array.from({ length: 12 }, (_, i) => {
    const generated = new Date(base);
    generated.setDate(generated.getDate() - Math.floor(r() * 60));
    const from = new Date(generated);
    from.setMonth(from.getMonth() - 12);
    return {
      id: `rep_${seed}_${i.toString().padStart(3, "0")}`,
      clientName: CLIENTS[Math.floor(r() * CLIENTS.length)]!,
      type: TYPES[Math.floor(r() * TYPES.length)]!,
      fromDate: from.toISOString().slice(0, 10),
      toDate: generated.toISOString().slice(0, 10),
      format: FORMATS[Math.floor(r() * FORMATS.length)]!,
      status: STATUSES[Math.floor(r() * STATUSES.length)]!,
      generatedAt: generated.toISOString(),
      generatedBy: by,
    };
  });
}
