import type { ClientLite, RmEarnings } from "@/types/rm";
import type { KycStatusLite } from "@/types/admin";
export { ONBOARDING_LEADS_FIXTURE as RM_LEADS_FIXTURE } from "@/features/onboarding/fixtures";

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

const FIRST = ["Aarav", "Saanvi", "Vivaan", "Anaya", "Reyansh", "Diya", "Krishna", "Kiara", "Arjun", "Myra", "Rohan", "Ishita", "Kabir", "Sara", "Aryan", "Riya"];
const LAST = ["Mehta", "Iyer", "Sharma", "Khanna", "Bose", "Reddy", "Patel", "Nair", "Verma", "Gupta"];
const KYC: KycStatusLite[] = ["verified", "verified", "verified", "verified", "pending", "rejected"];
const RISK = ["Conservative", "Moderate", "Aggressive"] as const;

function buildClients(): ClientLite[] {
  const r = seeded(101);
  const out: ClientLite[] = [];
  for (let i = 0; i < 42; i++) {
    const fn = FIRST[Math.floor(r() * FIRST.length)]!;
    const ln = LAST[Math.floor(r() * LAST.length)]!;
    const joined = new Date("2026-04-16");
    joined.setDate(joined.getDate() - Math.floor(r() * 700));
    const lastOrder = new Date("2026-04-16");
    lastOrder.setDate(lastOrder.getDate() - Math.floor(r() * 60));
    out.push({
      id: `cli_${i.toString().padStart(4, "0")}`,
      fullName: `${fn} ${ln}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@example.in`,
      phoneMasked: `+91 98•••••${Math.floor(100 + r() * 899)}`,
      kycStatus: KYC[Math.floor(r() * KYC.length)]!,
      aum: Math.round(120_000 + r() * 12_000_000),
      sipMonthly: [0, 0, 5000, 10000, 15000, 25000, 50000][Math.floor(r() * 7)]!,
      lastOrderAt: lastOrder.toISOString(),
      riskProfile: RISK[Math.floor(r() * RISK.length)]!,
      joinedAt: joined.toISOString(),
    });
  }
  return out;
}
export const RM_CLIENTS_FIXTURE: ClientLite[] = buildClients();


function buildEarnings(): RmEarnings {
  const r = seeded(303);
  const months = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"];
  const monthly = months.map((m, i) => ({
    month: m,
    commission: Math.round(220_000 + r() * 220_000 + i * 12_000),
    aum: Math.round(380_000_000 + r() * 80_000_000 + i * 8_000_000),
  }));
  return {
    mtdCommission: 380_000,
    ytdCommission: 3_240_000,
    pendingPayout: 540_000,
    aumServiced: 420_000_000,
    monthly,
  };
}
export const RM_EARNINGS_FIXTURE: RmEarnings = buildEarnings();
