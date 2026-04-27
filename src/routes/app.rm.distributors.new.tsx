import { createFileRoute, redirect } from "@tanstack/react-router";
import { DistributorForm } from "@/features/admin/components/distributor-form";
import { useRmDistributorsQuery } from "@/features/rm/api";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { useAuthStore } from "@/stores/auth-store";

export const Route = createFileRoute("/app/rm/distributors/new")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "rm") throw redirect({ to: ROLE_HOME[user.role] });
  },
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === "string" ? search.id : undefined,
  }),
  head: () => ({ meta: [{ title: "Distributor form — RM" }] }),
  component: RmDistributorFormPage,
});

function RmDistributorFormPage() {
  const { id } = Route.useSearch();
  const user = useAuthStore((s) => s.user);
  const { data } = useRmDistributorsQuery(user?.id);
  const distributor = id ? (data ?? []).find((d) => d.id === id) ?? null : null;
  return (
    <DistributorForm
      distributor={distributor}
      branches={[]}
      rms={[]}
      backTo="/app/rm/distributors"
      showAssignments={false}
      eyebrow="RM · Partners"
    />
  );
}
