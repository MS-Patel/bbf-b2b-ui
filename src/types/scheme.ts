import type { AssetClass, FundCategory } from "@/types/portfolio";

export type RiskLevel = "low" | "moderate" | "moderately_high" | "high" | "very_high";

export interface Scheme {
  id: string;
  schemeCode: string;
  schemeName: string;
  amc: string;
  category: FundCategory;
  assetClass: AssetClass;
  nav: number;
  navAsOf: string;
  return1y: number;
  return3y: number;
  return5y: number;
  expenseRatio: number;
  aumCr: number; // crores
  risk: RiskLevel;
  minLumpsum: number;
  minSip: number;
  rating: number; // 1-5
}
