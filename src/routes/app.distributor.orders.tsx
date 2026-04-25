import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { OrdersRegister } from "@/features/orders/components/orders-register";

export const Route = createFileRoute("/app/distributor/orders")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "distributor") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "Orders — Distributor" }] }),
  component: DistributorOrdersPage,
});

function DistributorOrdersPage() {
  const user = useAuthStore((s) => s.user);
  const placedBy = {
    id: user?.id ?? "usr_dist_001",
    name: user?.fullName ?? "Rohan Kapoor",
    role: "distributor" as const,
  };
  return (
    <OrdersRegister
      scope="distributor"
      placedBy={placedBy}
      eyebrow="Distributor · Orders"
      description="Orders placed for clients under your desk."
    />
  );
}
