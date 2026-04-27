import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { InviteLeadForm } from "@/features/onboarding/components/invite-lead-form";

export const Route = createFileRoute("/app/rm/onboarding/new")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "rm") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "Invite investor — RM" }] }),
  component: RmInviteLeadPage,
});

function RmInviteLeadPage() {
  const user = useAuthStore((s) => s.user);
  const owner = user
    ? { id: user.id, role: "rm" as const, name: user.fullName }
    : { id: "usr_rm_001", role: "rm" as const, name: "Priya Nair" };
  return <InviteLeadForm owner={owner} eyebrow="RM · Onboarding" backTo="/app/rm/onboarding" />;
}
