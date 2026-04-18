export interface SubBroker {
  id: string;
  name: string;
  rmCount: number;
  clientCount: number;
  aum: number;
  qtdGrowthPct: number;
  status: "active" | "review" | "inactive";
}

export interface DistributorOverview {
  totalAum: number;
  totalClients: number;
  rmCount: number;
  pendingPayout: number;
  aumTrend: Array<{ month: string; aum: number }>;
}
