import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { env } from "@/config/env";
import type { AuthTokens } from "@/types/api";
import type {
  ForgotPasswordPayload,
  LoginCredentials,
  OtpLoginPayload,
  User,
  UserRole,
} from "@/types/auth";

/**
 * Auth API surface (B2B-only).
 *
 * NOTE: While VITE_USE_MOCK_API is enabled (default in development), all
 * functions resolve with deterministic mock data. To wire up the real DRF
 * backend, set VITE_USE_MOCK_API=false and the calls fall through to axios.
 */

const MOCK_USERS: Record<UserRole, User> = {
  admin: {
    id: "usr_admin_001",
    email: "admin@buybestfin.dev",
    fullName: "Vikram Mehta",
    role: "admin",
    phone: "+91 99887 76655",
    createdAt: "2022-01-01T10:00:00Z",
  },
  rm: {
    id: "usr_rm_001",
    email: "rm@buybestfin.dev",
    fullName: "Priya Nair",
    role: "rm",
    phone: "+91 90000 11111",
    createdAt: "2023-08-20T10:00:00Z",
  },
  distributor: {
    id: "usr_dist_001",
    email: "distributor@buybestfin.dev",
    fullName: "Rohan Kapoor",
    role: "distributor",
    phone: "+91 91111 22222",
    createdAt: "2024-02-14T10:00:00Z",
  },
};

const MOCK_TOKENS: AuthTokens = {
  access: "mock.access.token",
  refresh: "mock.refresh.token",
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface AuthResult {
  user: User;
  tokens: AuthTokens;
}

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    if (env.USE_MOCK_API) {
      await wait(700);
      if (credentials.password.length < 6) {
        throw Object.assign(new Error("Invalid email or password"), { status: 401 });
      }
      return { user: { ...MOCK_USERS[credentials.role], email: credentials.email }, tokens: MOCK_TOKENS };
    }
    return api.post<AuthResult, LoginCredentials>("/auth/login/", credentials);
  },

  async loginWithOtp(payload: OtpLoginPayload): Promise<AuthResult> {
    if (env.USE_MOCK_API) {
      await wait(700);
      if (payload.otp !== "123456") {
        throw Object.assign(new Error("Invalid OTP. Use 123456 in mock mode."), { status: 401 });
      }
      return { user: MOCK_USERS[payload.role], tokens: MOCK_TOKENS };
    }
    return api.post<AuthResult, OtpLoginPayload>("/auth/otp/verify/", payload);
  },

  async requestOtp(identifier: string): Promise<{ sent: true }> {
    if (env.USE_MOCK_API) {
      await wait(500);
      return { sent: true };
    }
    return api.post("/auth/otp/request/", { identifier });
  },

  async forgotPassword(payload: ForgotPasswordPayload): Promise<{ sent: true }> {
    if (env.USE_MOCK_API) {
      await wait(600);
      return { sent: true };
    }
    return api.post("/auth/password/reset/", payload);
  },

  async logout(): Promise<void> {
    if (env.USE_MOCK_API) {
      await wait(150);
      return;
    }
    await api.post("/auth/logout/");
  },
};

/* ─── React Query hooks ─────────────────────────────────────────────── */

export function useLoginMutation() {
  return useMutation({ mutationFn: (c: LoginCredentials) => authApi.login(c) });
}

export function useOtpLoginMutation() {
  return useMutation({ mutationFn: (p: OtpLoginPayload) => authApi.loginWithOtp(p) });
}

export function useRequestOtpMutation() {
  return useMutation({ mutationFn: (identifier: string) => authApi.requestOtp(identifier) });
}

export function useForgotPasswordMutation() {
  return useMutation({ mutationFn: (p: ForgotPasswordPayload) => authApi.forgotPassword(p) });
}

export function useLogoutMutation() {
  return useMutation({ mutationFn: () => authApi.logout() });
}
