import { createFileRoute, redirect } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { useRmClientsQuery } from "@/features/rm/api";
import { useClientReportsHistoryQuery } from "@/features/reports/api";
import { ClientReportsForm } from "@/features/reports/components/client-reports-form";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";

export const Route = createFileRoute("/app/rm/client-reports")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "rm") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "Client reports — RM" }] }),
  component: RmClientReportsPage,
});

export default function RmClientReportsPage() {
  const user = useAuthStore((s) => s.user);
  const { data: clients = [] } = useRmClientsQuery();
  const { data: history = [], isLoading } = useClientReportsHistoryQuery("rm", user?.email ?? "rm");

  return (
    <>
      <PageHeader
        eyebrow="RM · Reports"
        title="Client comprehensive reports"
        description="Generate Wealth, P&L, Capital Gains, Transaction and Holding reports on behalf of your investors."
      />
      <div className="px-6 py-6 sm:px-8">
        <ClientReportsForm
          clients={clients.map((c) => ({ id: c.id, fullName: c.fullName, email: c.email }))}
          history={history}
          isLoading={isLoading}
          ownerLabel={user?.email ?? "RM"}
        />
      </div>
    </>
  );
}
