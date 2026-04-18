import { create } from "zustand";
import type { ClientLite } from "@/types/rm";

interface ImpersonationState {
  client: ClientLite | null;
  start: (client: ClientLite) => void;
  stop: () => void;
}

/**
 * Lightweight in-memory impersonation store.
 * Not persisted — exiting the app ends the session, by design.
 */
export const useImpersonationStore = create<ImpersonationState>((set) => ({
  client: null,
  start: (client) => set({ client }),
  stop: () => set({ client: null }),
}));
