import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    const { isAuthenticated, user } = useAuthStore.getState();
    if (isAuthenticated && user) {
      throw redirect({ to: ROLE_HOME[user.role] });
    }
    throw redirect({ to: "/login" });
  },
  component: () => null,
});
