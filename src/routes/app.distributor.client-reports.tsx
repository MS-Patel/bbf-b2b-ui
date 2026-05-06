import { createFileRoute, redirect } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { useRmClientsQuery } from "@/features/rm/api";
import { useClientReportsHistoryQuery } from "@/features/reports/api";
import { ClientReportsForm } from "@/features/reports/components/client-reports-form";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";

export const Route = createFileRoute("/app/distributor/client-reports")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "distributor") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "Client reports — Distributor" }] }),
  component: DistributorClientReportsPage,
});

export default function DistributorClientReportsPage() {
  const user = useAuthStore((s) => s.user);
  // Distributor uses the same shared client roster fixture as RM (mock data).
  const { data: clients = [] } = useRmClientsQuery();
  const { data: history = [], isLoading } = useClientReportsHistoryQuery("distributor", user?.email ?? "distributor");

  return (
    <>
      <PageHeader
        eyebrow="Distributor · Reports"
        title="Client comprehensive reports"
        description="Generate Wealth, P&L, Capital Gains, Transaction and Holding reports for your investors."
      />
      <div className="px-6 py-6 sm:px-8">
        <ClientReportsForm
          clients={clients.map((c) => ({ id: c.id, fullName: c.fullName, email: c.email }))}
          history={history}
          isLoading={isLoading}
          ownerLabel={user?.email ?? "Distributor"}
        />
      </div>
    </>
  );
}
