import { createFileRoute, redirect } from "@tanstack/react-router";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  useMarkAllReadMutation,
  useMarkReadMutation,
  useNotificationsQuery,
} from "@/features/notifications/api";
import { NotificationRow } from "@/features/notifications/notifications-bell";
import { useAuthStore } from "@/stores/auth-store";

export const Route = createFileRoute("/app/notifications")({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) throw redirect({ to: "/login" });
  },
  head: () => ({ meta: [{ title: "Notifications — WealthOS" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { data, isLoading } = useNotificationsQuery();
  const markRead = useMarkReadMutation();
  const markAllRead = useMarkAllReadMutation();
  const items = data ?? [];
  const unread = items.filter((n) => !n.read);
  const read = items.filter((n) => n.read);

  return (
    <>
      <PageHeader
        eyebrow="Inbox"
        title="Notifications"
        description="Order confirmations, KYC updates, mandates, and portfolio alerts."
        actions={
          unread.length > 0 && (
            <Button
              variant="outline"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          )
        }
      />

      <div className="px-6 py-6 sm:px-8">
        <Card className="shadow-card">
          <CardContent className="p-4 sm:p-6">
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">All ({items.length})</TabsTrigger>
                <TabsTrigger value="unread">Unread ({unread.length})</TabsTrigger>
                <TabsTrigger value="read">Read ({read.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                <List
                  items={items}
                  loading={isLoading}
                  onRead={(id) => markRead.mutate(id)}
                />
              </TabsContent>
              <TabsContent value="unread" className="mt-4">
                <List items={unread} loading={isLoading} onRead={(id) => markRead.mutate(id)} />
              </TabsContent>
              <TabsContent value="read" className="mt-4">
                <List items={read} loading={isLoading} onRead={(id) => markRead.mutate(id)} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function List({
  items,
  loading,
  onRead,
}: {
  items: ReturnType<typeof useNotificationsQuery>["data"] extends infer T
    ? T extends Array<infer U>
      ? U[]
      : never
    : never;
  loading: boolean;
  onRead: (id: string) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-secondary">
          <Bell className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">No notifications here</p>
        <p className="text-xs text-muted-foreground">You'll see updates as they arrive.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      {items.map((n) => (
        <NotificationRow key={n.id} notification={n} onRead={onRead} />
      ))}
    </div>
  );
}
