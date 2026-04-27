import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { InviteLeadForm } from "@/features/onboarding/components/invite-lead-form";

export const Route = createFileRoute("/app/distributor/onboarding/new")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "distributor") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "Invite investor — Distributor" }] }),
  component: DistributorInviteLeadPage,
});

function DistributorInviteLeadPage() {
  const user = useAuthStore((s) => s.user);
  const owner = user
    ? { id: user.id, role: "distributor" as const, name: user.fullName }
    : { id: "usr_dist_001", role: "distributor" as const, name: "Rohan Kapoor" };
  return <InviteLeadForm owner={owner} eyebrow="Distributor · Onboarding" backTo="/app/distributor/onboarding" />;
}
