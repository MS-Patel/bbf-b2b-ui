import type { DistributorOverview, SubBroker } from "@/types/distributor";

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

const NAMES = [
  "Mumbai West Wealth Hub",
  "Bangalore Tech Park Desk",
  "Delhi NCR Premier",
  "Hyderabad Cyber Hub",
  "Chennai Anna Salai",
  "Pune Koregaon Park",
  "Kolkata Salt Lake",
  "Ahmedabad CG Road",
  "Gurgaon DLF Phase 3",
  "Noida Sector 62",
  "Jaipur Vaishali Nagar",
  "Kochi Marine Drive",
];
const STATUSES = ["active", "active", "active", "review", "inactive"] as const;

function buildSubBrokers(): SubBroker[] {
  const r = seeded(501);
  return NAMES.map((name, i) => ({
    id: `sb_${i.toString().padStart(3, "0")}`,
    name,
    rmCount: Math.floor(2 + r() * 8),
    clientCount: Math.floor(40 + r() * 320),
    aum: Math.round(80_000_000 + r() * 280_000_000),
    qtdGrowthPct: +(((r() * 18) - 4).toFixed(1)),
    status: STATUSES[Math.floor(r() * STATUSES.length)]!,
  }));
}
export const SUB_BROKERS_FIXTURE: SubBroker[] = buildSubBrokers();

function buildOverview(): DistributorOverview {
  const r = seeded(602);
  const months = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"];
  const aumTrend = months.map((m, i) => ({
    month: m,
    aum: Math.round(1_080_000_000 + i * 32_000_000 + r() * 18_000_000),
  }));
  const totals = SUB_BROKERS_FIXTURE.reduce(
    (acc, s) => {
      acc.aum += s.aum;
      acc.clients += s.clientCount;
      acc.rms += s.rmCount;
      return acc;
    },
    { aum: 0, clients: 0, rms: 0 },
  );
  return {
    totalAum: totals.aum,
    totalClients: totals.clients,
    rmCount: totals.rms,
    pendingPayout: 2_400_000,
    aumTrend,
  };
}
export const DISTRIBUTOR_OVERVIEW_FIXTURE: DistributorOverview = buildOverview();
