import { useQuery } from "@tanstack/react-query";
import {
  ADMIN_OVERVIEW_FIXTURE,
  AMC_MASTER_FIXTURE,
  BRANCHES_FIXTURE,
  BROKERAGE_IMPORTS_FIXTURE,
  COMMISSIONS_FIXTURE,
  DISTRIBUTOR_CATEGORIES_FIXTURE,
  DISTRIBUTORS_FIXTURE,
  INTEGRATIONS_FIXTURE,
  INTEGRATION_LOGS_FIXTURE,
  INVESTOR_DISTRIBUTOR_MAPPINGS_FIXTURE,
  MASTER_UPLOADS_FIXTURE,
  PAYOUTS_FIXTURE,
  PAYOUT_CYCLE_SUMMARIES_FIXTURE,
  PLATFORM_USERS,
  RM_MAPPINGS_FIXTURE,
  RMS_FIXTURE,
} from "./fixtures";

function delay<T>(value: T, ms = 380): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export function useAdminOverviewQuery() {
  return useQuery({
    queryKey: ["admin", "overview"],
    queryFn: () => delay(ADMIN_OVERVIEW_FIXTURE),
    staleTime: 60_000,
  });
}

export function usePlatformUsersQuery() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => delay(PLATFORM_USERS),
    staleTime: 60_000,
  });
}

export function useCommissionsQuery() {
  return useQuery({
    queryKey: ["admin", "commissions"],
    queryFn: () => delay(COMMISSIONS_FIXTURE),
    staleTime: 60_000,
  });
}

export function usePayoutsQuery() {
  return useQuery({
    queryKey: ["admin", "payouts"],
    queryFn: () => delay(PAYOUTS_FIXTURE),
    staleTime: 60_000,
  });
}

export function useIntegrationsQuery() {
  return useQuery({
    queryKey: ["admin", "integrations"],
    queryFn: () => delay({ health: INTEGRATIONS_FIXTURE, logs: INTEGRATION_LOGS_FIXTURE }),
    staleTime: 60_000,
  });
}

export function useBranchesQuery() {
  return useQuery({
    queryKey: ["admin", "branches"],
    queryFn: () => delay(BRANCHES_FIXTURE),
    staleTime: 60_000,
  });
}

export function useMasterDataQuery() {
  return useQuery({
    queryKey: ["admin", "master-data"],
    queryFn: () => delay({ uploads: MASTER_UPLOADS_FIXTURE, amcs: AMC_MASTER_FIXTURE }),
    staleTime: 60_000,
  });
}

export function useDistributorsQuery() {
  return useQuery({
    queryKey: ["admin", "distributors"],
    queryFn: () => delay(DISTRIBUTORS_FIXTURE),
    staleTime: 60_000,
  });
}

export function useRmsQuery() {
  return useQuery({
    queryKey: ["admin", "rms"],
    queryFn: () => delay(RMS_FIXTURE),
    staleTime: 60_000,
  });
}

export function useUserMappingsQuery() {
  return useQuery({
    queryKey: ["admin", "user-mappings"],
    queryFn: () => delay({ investors: INVESTOR_DISTRIBUTOR_MAPPINGS_FIXTURE, rms: RM_MAPPINGS_FIXTURE }),
    staleTime: 60_000,
  });
}

export function useBrokerageImportsQuery() {
  return useQuery({
    queryKey: ["admin", "brokerage-imports"],
    queryFn: () => delay(BROKERAGE_IMPORTS_FIXTURE),
    staleTime: 60_000,
  });
}

export function useDistributorCategoriesQuery() {
  return useQuery({
    queryKey: ["admin", "distributor-categories"],
    queryFn: () => delay(DISTRIBUTOR_CATEGORIES_FIXTURE),
    staleTime: 60_000,
  });
}

export function usePayoutCycleSummariesQuery() {
  return useQuery({
    queryKey: ["admin", "payout-cycle-summaries"],
    queryFn: () => delay(PAYOUT_CYCLE_SUMMARIES_FIXTURE),
    staleTime: 60_000,
  });
}
