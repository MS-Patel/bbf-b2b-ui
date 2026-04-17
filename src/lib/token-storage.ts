import { env } from "@/config/env";
import type { AuthTokens } from "@/types/api";

/**
 * SSR-safe token storage. Wraps localStorage with try/catch so it's
 * harmless during server rendering and in private-browsing mode.
 */
export const tokenStorage = {
  get(): AuthTokens | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(env.TOKEN_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AuthTokens) : null;
    } catch {
      return null;
    }
  },
  set(tokens: AuthTokens): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(env.TOKEN_STORAGE_KEY, JSON.stringify(tokens));
    } catch {
      /* noop */
    }
  },
  clear(): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(env.TOKEN_STORAGE_KEY);
    } catch {
      /* noop */
    }
  },
};
