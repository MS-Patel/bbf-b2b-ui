import { createFileRoute, redirect } from "@tanstack/react-router";
import { DistributorForm } from "@/features/admin/components/distributor-form";
import { useBranchesQuery, useDistributorsQuery, useRmsQuery } from "@/features/admin/api";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { useAuthStore } from "@/stores/auth-store";

export const Route = createFileRoute("/app/admin/distributors/new")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "admin") throw redirect({ to: ROLE_HOME[user.role] });
  },
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === "string" ? search.id : undefined,
  }),
  head: () => ({ meta: [{ title: "Distributor form — Admin" }] }),
  component: AdminDistributorFormPage,
});

function AdminDistributorFormPage() {
  const { id } = Route.useSearch();
  const { data: distributors } = useDistributorsQuery();
  const { data: branches } = useBranchesQuery();
  const { data: rms } = useRmsQuery();
  const distributor = id ? (distributors ?? []).find((d) => d.id === id) ?? null : null;
  return (
    <DistributorForm
      distributor={distributor}
      branches={branches ?? []}
      rms={rms ?? []}
      backTo="/app/admin/distributors"
    />
  );
}
