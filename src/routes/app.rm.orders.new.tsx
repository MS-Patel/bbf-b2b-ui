import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { PlaceOrderForm } from "@/features/orders/components/place-order-form";

export const Route = createFileRoute("/app/rm/orders/new")({
  validateSearch: (search: Record<string, unknown>) => ({
    clientId: typeof search.clientId === "string" ? search.clientId : undefined,
    draftId: typeof search.draftId === "string" ? search.draftId : undefined,
  }),
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "rm") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "New Order — RM" }] }),
  component: RmNewOrderPage,
});

function RmNewOrderPage() {
  const user = useAuthStore((s) => s.user);
  const { clientId, draftId } = Route.useSearch();
  const placedBy = {
    id: user?.id ?? "usr_rm_001",
    name: user?.fullName ?? "Priya Nair",
    role: "rm" as const,
  };
  return (
    <PlaceOrderForm
      scope="rm"
      placedBy={placedBy}
      eyebrow="RM · New order"
      backTo="/app/rm/orders"
      preselectedClientId={clientId}
      draftId={draftId}
    />
  );
}
