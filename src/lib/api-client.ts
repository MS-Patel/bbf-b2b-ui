import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { env } from "@/config/env";
import { tokenStorage } from "@/lib/token-storage";
import { ApiError, type ApiErrorResponse, type AuthTokens } from "@/types/api";

/**
 * Singleton Axios instance for all DRF requests.
 * Adds Authorization headers, refreshes JWT on 401, and normalises errors.
 *
 * Components NEVER import this directly — feature-level API modules do.
 */

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshInflight: Promise<AuthTokens | null> | null = null;
let onUnauthorized: (() => void) | null = null;

export function registerUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: env.API_BASE_URL,
  timeout: 20_000,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const tokens = tokenStorage.get();
  if (tokens?.access && config.headers) {
    config.headers.Authorization = `Bearer ${tokens.access}`;
  }
  return config;
});

async function refreshTokens(): Promise<AuthTokens | null> {
  const tokens = tokenStorage.get();
  if (!tokens?.refresh) return null;
  try {
    const response = await axios.post<AuthTokens>(
      `${env.API_BASE_URL}/auth/token/refresh/`,
      { refresh: tokens.refresh },
      { headers: { "Content-Type": "application/json" } },
    );
    const next: AuthTokens = { access: response.data.access, refresh: response.data.refresh ?? tokens.refresh };
    tokenStorage.set(next);
    return next;
  } catch {
    tokenStorage.clear();
    return null;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status ?? 0;

    if (status === 401 && original && !original._retry && !original.url?.includes("/auth/token/refresh")) {
      original._retry = true;
      refreshInflight ??= refreshTokens().finally(() => {
        refreshInflight = null;
      });
      const refreshed = await refreshInflight;
      if (refreshed) {
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${refreshed.access}`;
        return apiClient(original);
      }
      onUnauthorized?.();
    }

    const data = error.response?.data;
    const message = data?.detail ?? error.message ?? "Network error";
    return Promise.reject(new ApiError(message, status, data?.code, data?.errors));
  },
);

/** Thin typed wrappers used by feature API modules. */
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) => apiClient.get<T>(url, config).then((r) => r.data),
  post: <T, B = unknown>(url: string, body?: B, config?: AxiosRequestConfig) =>
    apiClient.post<T>(url, body, config).then((r) => r.data),
  put: <T, B = unknown>(url: string, body?: B, config?: AxiosRequestConfig) =>
    apiClient.put<T>(url, body, config).then((r) => r.data),
  patch: <T, B = unknown>(url: string, body?: B, config?: AxiosRequestConfig) =>
    apiClient.patch<T>(url, body, config).then((r) => r.data),
  delete: <T>(url: string, config?: AxiosRequestConfig) => apiClient.delete<T>(url, config).then((r) => r.data),
};
