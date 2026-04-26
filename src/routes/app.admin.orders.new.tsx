import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { PlaceOrderForm } from "@/features/orders/components/place-order-form";

export const Route = createFileRoute("/app/admin/orders/new")({
  validateSearch: (search: Record<string, unknown>) => ({
    clientId: typeof search.clientId === "string" ? search.clientId : undefined,
  }),
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "admin") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "New Order — Admin" }] }),
  component: AdminNewOrderPage,
});

function AdminNewOrderPage() {
  const user = useAuthStore((s) => s.user);
  const { clientId } = Route.useSearch();
  const placedBy = {
    id: user?.id ?? "usr_admin_01",
    name: user?.fullName ?? "Admin Desk",
    role: "admin" as const,
  };
  return (
    <PlaceOrderForm
      scope="all"
      placedBy={placedBy}
      eyebrow="Admin · New order"
      backTo="/app/admin/orders"
      preselectedClientId={clientId}
    />
  );
}
