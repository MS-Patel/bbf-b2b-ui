/**
 * Centralized environment & runtime configuration.
 * Never read import.meta.env directly outside this file.
 */

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "https://api.wealthos.example.com";

const USE_MOCK_API =
  (import.meta.env.VITE_USE_MOCK_API as string | undefined) !== "false";

export const env = {
  API_BASE_URL,
  USE_MOCK_API,
  APP_NAME: "WealthOS",
  TOKEN_STORAGE_KEY: "wealthos.tokens",
  AUTH_STORAGE_KEY: "wealthos.auth",
} as const;

export type Env = typeof env;
