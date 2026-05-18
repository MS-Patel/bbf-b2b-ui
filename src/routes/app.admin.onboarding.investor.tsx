import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { InvestorOnboardingPage } from "@/features/investor-onboarding/components/InvestorOnboardingPage";

export const Route = createFileRoute("/app/admin/onboarding/investor")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "admin") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "New investor onboarding — Admin" }] }),
  component: InvestorOnboardingPage,
});
