import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { OrdersRegister } from "@/features/orders/components/orders-register";

export const Route = createFileRoute("/app/admin/orders")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "admin") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "Orders — Admin" }] }),
  component: AdminOrdersPage,
});

function AdminOrdersPage() {
  const user = useAuthStore((s) => s.user);
  const placedBy = {
    id: user?.id ?? "usr_admin_01",
    name: user?.fullName ?? "Admin Desk",
    role: "admin" as const,
  };
  return (
    <OrdersRegister
      scope="all"
      placedBy={placedBy}
      eyebrow="Admin · Orders"
      description="All orders placed on behalf of investors across the platform."
      showPlacedBy
    />
  );
}
