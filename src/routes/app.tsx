import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { AppShell } from "@/components/layout/app-shell";
import { useAuthStore } from "@/stores/auth-store";

const searchSchema = z.object({
  redirect: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/app")({
  validateSearch: searchSchema,
  beforeLoad: ({ location }) => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  component: AppShell,
});

// Outlet is rendered inside AppShell.
void Outlet;
