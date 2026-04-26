import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { PlaceOrderForm } from "@/features/orders/components/place-order-form";

export const Route = createFileRoute("/app/distributor/orders/new")({
  validateSearch: (search: Record<string, unknown>) => ({
    clientId: typeof search.clientId === "string" ? search.clientId : undefined,
  }),
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "distributor") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "New Order — Distributor" }] }),
  component: DistributorNewOrderPage,
});

function DistributorNewOrderPage() {
  const user = useAuthStore((s) => s.user);
  const { clientId } = Route.useSearch();
  const placedBy = {
    id: user?.id ?? "usr_dist_001",
    name: user?.fullName ?? "Rohan Kapoor",
    role: "distributor" as const,
  };
  return (
    <PlaceOrderForm
      scope="distributor"
      placedBy={placedBy}
      eyebrow="Distributor · New order"
      backTo="/app/distributor/orders"
      preselectedClientId={clientId}
    />
  );
}
