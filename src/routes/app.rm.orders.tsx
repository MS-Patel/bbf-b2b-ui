import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { OrdersRegister } from "@/features/orders/components/orders-register";

export const Route = createFileRoute("/app/rm/orders")({
  validateSearch: (search: Record<string, unknown>) => ({
    clientId: typeof search.clientId === "string" ? search.clientId : undefined,
  }),
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "rm") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "Orders — RM" }] }),
  component: RmOrdersPage,
});

function RmOrdersPage() {
  const user = useAuthStore((s) => s.user);
  const { clientId } = Route.useSearch();
  const placedBy = {
    id: user?.id ?? "usr_rm_001",
    name: user?.fullName ?? "Priya Nair",
    role: "rm" as const,
  };
  return (
    <OrdersRegister
      scope="rm"
      placedBy={placedBy}
      eyebrow="RM · Orders"
      description="Orders you've placed on behalf of your clients."
      preselectedClientId={clientId}
    />
  );
}
