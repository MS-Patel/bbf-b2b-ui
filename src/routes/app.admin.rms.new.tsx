import { createFileRoute, redirect } from "@tanstack/react-router";
import { RmForm } from "@/features/admin/components/rm-form";
import { useBranchesQuery, useDistributorsQuery, useRmsQuery } from "@/features/admin/api";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { useAuthStore } from "@/stores/auth-store";

export const Route = createFileRoute("/app/admin/rms/new")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "admin") throw redirect({ to: ROLE_HOME[user.role] });
  },
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === "string" ? search.id : undefined,
  }),
  head: () => ({ meta: [{ title: "RM form — Admin" }] }),
  component: AdminRmFormPage,
});

function AdminRmFormPage() {
  const { id } = Route.useSearch();
  const { data: rms } = useRmsQuery();
  const { data: branches } = useBranchesQuery();
  const { data: distributors } = useDistributorsQuery();
  const rm = id ? (rms ?? []).find((r) => r.id === id) ?? null : null;
  return <RmForm rm={rm} branches={branches ?? []} distributors={distributors ?? []} backTo="/app/admin/rms" />;
}
