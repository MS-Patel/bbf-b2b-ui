import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { HandCoins, TrendingUp, Wallet, Clock } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRmEarningsQuery } from "@/features/rm/api";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { formatCompactINR, formatINR } from "@/lib/format";

export const Route = createFileRoute("/app/rm/earnings")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "rm") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "Earnings — RM" }] }),
  component: RmEarningsPage,
});

function RmEarningsPage() {
  const { data } = useRmEarningsQuery();
  if (!data) return null;

  const stats = [
    { label: "MTD commission", value: formatINR(data.mtdCommission), icon: HandCoins },
    { label: "YTD commission", value: formatINR(data.ytdCommission), icon: TrendingUp },
    { label: "AUM serviced", value: formatCompactINR(data.aumServiced), icon: Wallet },
    { label: "Pending payout", value: formatINR(data.pendingPayout), icon: Clock },
  ];

  return (
    <>
      <PageHeader eyebrow="RM · Business" title="Earnings" description="Track your commissions, AUM under service, and pending payouts." />
      <div className="space-y-6 px-6 py-6 sm:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className="shadow-card">
                <CardContent className="p-5">
                  <div className="grid h-10 w-10 place-items-center rounded-xl gradient-accent text-accent-foreground shadow-glow">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <p className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">{s.label}</p>
                  <p className="mt-1 font-display text-2xl font-bold tabular-nums">{s.value}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Monthly commissions</CardTitle>
            <CardDescription>6-month earned commission trend.</CardDescription>
          </CardHeader>
          <CardContent className="px-2 pb-4 sm:px-4">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.monthly} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--color-muted-foreground)" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickFormatter={(v) => formatCompactINR(Number(v))} stroke="var(--color-muted-foreground)" tickLine={false} axisLine={false} fontSize={11} width={68} />
                <Tooltip formatter={(v) => formatINR(Number(v))} contentStyle={{ borderRadius: 8, background: "var(--color-popover)", border: "1px solid var(--color-border)" }} />
                <Bar dataKey="commission" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
