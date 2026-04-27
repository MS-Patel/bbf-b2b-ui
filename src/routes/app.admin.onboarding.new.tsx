import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { InviteLeadForm } from "@/features/onboarding/components/invite-lead-form";

export const Route = createFileRoute("/app/admin/onboarding/new")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "admin") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "Invite investor — Admin" }] }),
  component: AdminInviteLeadPage,
});

function AdminInviteLeadPage() {
  const user = useAuthStore((s) => s.user);
  const owner = {
    id: user?.id ?? "usr_admin_01",
    role: "admin" as const,
    name: user?.fullName ?? "Admin Desk",
  };
  return <InviteLeadForm owner={owner} eyebrow="Admin · Onboarding" backTo="/app/admin/onboarding" />;
}
