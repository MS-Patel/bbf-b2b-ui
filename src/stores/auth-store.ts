import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { env } from "@/config/env";
import { tokenStorage } from "@/lib/token-storage";
import type { AuthTokens } from "@/types/api";
import type { User, UserRole } from "@/types/auth";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setSession: (payload: { user: User; tokens: AuthTokens }) => void;
  setUser: (user: User) => void;
  clearSession: () => void;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: ReadonlyArray<UserRole>) => boolean;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isHydrated: false,
      setSession: ({ user, tokens }) => {
        tokenStorage.set(tokens);
        set({ user, isAuthenticated: true });
      },
      setUser: (user) => set({ user }),
      clearSession: () => {
        tokenStorage.clear();
        set({ user: null, isAuthenticated: false });
      },
      hasRole: (role) => get().user?.role === role,
      hasAnyRole: (roles) => {
        const r = get().user?.role;
        return r ? roles.includes(r) : false;
      },
      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: env.AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => undefined,
            removeItem: () => undefined,
          };
        }
        return window.localStorage;
      }),
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);
