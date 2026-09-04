"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { notificationApi } from "@/lib/services";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  read: boolean;
  entity_type: string | null;
  created_at: string;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.floor(h / 24)} day ago`;
}

export default function NotificationsPage() {
  const qc = useQueryClient();
  const { data: notifications = [], isLoading } = useQuery<NotificationItem[]>({
    queryKey: ["notifications"],
    queryFn: () => notificationApi.get("/v1/notifications/").then((r) => r.data),
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationApi.put("/v1/notifications/read-all"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationApi.put(`/v1/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="System alerts and compliance updates"
        actions={
          unread > 0 ? (
            <Button size="sm" variant="outline" onClick={() => markAllRead.mutate()}>
              Mark all read ({unread})
            </Button>
          ) : undefined
        }
      />
      <Card>
        <CardContent className="p-0 divide-y divide-[var(--border)]">
          {isLoading ? (
            <p className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">Loading…</p>
          ) : notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">No notifications.</p>
          ) : notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.read && markRead.mutate(n.id)}
              className={`flex items-start gap-4 px-4 py-4 hover:bg-[var(--muted)] cursor-pointer transition-colors ${!n.read ? "bg-blue-50/30" : ""}`}
            >
              <div className="mt-0.5 flex-shrink-0 text-[var(--primary)]">
                <Bell className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm ${!n.read ? "font-semibold" : "font-medium"}`}>{n.title}</p>
                  <span className="text-xs text-[var(--muted-foreground)] flex-shrink-0">{timeAgo(n.created_at)}</span>
                </div>
                <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{n.body}</p>
              </div>
              {!n.read && (
                <div className="mt-2 h-2 w-2 rounded-full bg-[var(--primary)] flex-shrink-0" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
