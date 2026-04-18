import { useQuery } from "@tanstack/react-query";
import {
  ADMIN_OVERVIEW_FIXTURE,
  COMMISSIONS_FIXTURE,
  INTEGRATIONS_FIXTURE,
  INTEGRATION_LOGS_FIXTURE,
  PAYOUTS_FIXTURE,
  PLATFORM_USERS,
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
