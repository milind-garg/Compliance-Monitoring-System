"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, AlertTriangle, ClipboardList, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { notificationApi } from "@/lib/services";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  read: boolean;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
}

const ENTITY_ROUTES: Record<string, string> = {
  violation: "/violations",
  inspection: "/inspections",
  compliance: "/compliance",
};

const ENTITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  violation: AlertTriangle,
  inspection: ClipboardList,
  compliance: ShieldCheck,
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.floor(h / 24)} day ago`;
}

// ── Demo data (shown when API returns no notifications) ───────────────────────
const now = new Date();
const mins = (n: number) => new Date(now.getTime() - n * 60000).toISOString();
const hrs  = (n: number) => new Date(now.getTime() - n * 3600000).toISOString();
const days = (n: number) => new Date(now.getTime() - n * 86400000).toISOString();

const DEMO_NOTIFICATIONS: NotificationItem[] = [
  { id: "n1", title: "🚨 Critical Violation: Methane Overconcentration",          body: "Face 14-C, North Shaft — methane at 1.4% TLV. Evacuation completed. Immediate action required.",                         read: false, entity_type: "violation",  entity_id: "v1", created_at: mins(12) },
  { id: "n2", title: "⚠️ Safety Inspection Overdue — Dhanbad North Pit",          body: "The scheduled safety inspection for Dhanbad North Pit is 2 days overdue. Please assign an inspector immediately.",         read: false, entity_type: "inspection", entity_id: "i4", created_at: hrs(2)  },
  { id: "n3", title: "Inspection Completed — Jharia Coalfield Alpha",              body: "September safety inspection complete. 3 violations found. Corrective actions have been created automatically.",             read: false, entity_type: "inspection", entity_id: "i1", created_at: hrs(4)  },
  { id: "n4", title: "Compliance Record Approved — Raniganj Central Block",        body: "Q2 FY 2025-26 compliance submission for Raniganj Central Block has been approved by Mine Manager.",                         read: true,  entity_type: "compliance", entity_id: "c2", created_at: hrs(6)  },
  { id: "n5", title: "New Violation Reported — Environmental (High Severity)",     body: "Effluent discharge at Raniganj washery pond exceeds MOEF limit by 4.8x. Assigned to Vikram Singh for resolution.",        read: false, entity_type: "violation",  entity_id: "v2", created_at: hrs(8)  },
  { id: "n6", title: "Inspection Scheduled — Raniganj Central Block",              body: "DGMS statutory inspection scheduled for 15 Sept 2026. Inspector Anita Sharma has been assigned.",                           read: true,  entity_type: "inspection", entity_id: "i8", created_at: hrs(12) },
  { id: "n7", title: "Violation Resolved — Labour Overtime Breach",                body: "Violation V-004 (overtime breach, Bokaro Deep Mine) has been marked as resolved by Sunita Devi.",                          read: true,  entity_type: "violation",  entity_id: "v4", created_at: days(1) },
  { id: "n8", title: "AI Risk Alert — Korba Main Complex flagged as HIGH RISK",    body: "AI engine detected anomalous pattern: compliance score dropped 18 pts in 30 days. Immediate review recommended.",          read: true,  entity_type: null,         entity_id: null, created_at: days(1) },
  { id: "n9", title: "Report Generated — Q2 Compliance Summary",                   body: "Your Q2 FY 2025-26 Compliance Summary report (2.5 MB PDF) is ready for download from the Reports section.",               read: true,  entity_type: null,         entity_id: null, created_at: days(2) },
  { id: "n10",title: "Reminder: First-aid Kit Inspection Due Tomorrow",            body: "Compliance item: First-aid station inspection at Giridih Open-cast is due 06 Sept 2026. Please assign an inspector.",      read: true,  entity_type: "compliance", entity_id: "c10",created_at: days(2) },
];
// ─────────────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const qc = useQueryClient();
  const router = useRouter();

  const { data: notifications = [], isLoading, error } = useQuery<NotificationItem[]>({
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

  const handleClick = (n: NotificationItem) => {
    if (!n.read) markRead.mutate(n.id);
    const route = n.entity_type ? ENTITY_ROUTES[n.entity_type] : null;
    if (route && n.entity_id) router.push(`${route}/${n.entity_id}`);
  };

  // Fall back to demo data when the API returns nothing or fails
  const displayNotifications = notifications.length > 0 ? notifications : DEMO_NOTIFICATIONS;
  const isDemo = notifications.length === 0 && !isLoading;

  const unread = displayNotifications.filter((n) => !n.read).length;

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="System alerts and compliance updates"
        actions={
          <div className="flex items-center gap-2">
            {isDemo && (
              <span className="text-xs bg-[#b77a45]/15 text-[#874f20] border border-[#b77a45]/30 rounded-full px-2.5 py-0.5 font-medium">
                Demo data
              </span>
            )}
            {unread > 0 ? (
              <Button size="sm" variant="outline" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
                Mark all read ({unread})
              </Button>
            ) : undefined}
          </div>
        }
      />
      <Card>
        <CardContent className="p-0 divide-y divide-[var(--border)]">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 px-4 py-4">
                <Skeleton className="h-5 w-5 rounded-full shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-3 w-4/5" />
                </div>
              </div>
            ))
          ) : displayNotifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-[var(--muted-foreground)]">
              <Bell className="h-8 w-8 opacity-30" />
              <p className="text-sm">No notifications yet.</p>
            </div>
          ) : displayNotifications.map((n) => {
            const Icon = (n.entity_type && ENTITY_ICONS[n.entity_type]) ? ENTITY_ICONS[n.entity_type] : Bell;
            const clickable = !!(n.entity_type && ENTITY_ROUTES[n.entity_type] && n.entity_id);
            return (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className={`flex items-start gap-4 px-4 py-4 transition-colors ${clickable || !n.read ? "cursor-pointer hover:bg-[var(--stone)]/40" : ""} ${!n.read ? "bg-[#2f6664]/5" : ""}`}
              >
                <div className={`mt-0.5 flex-shrink-0 ${!n.read ? "text-[#2f6664]" : "text-[var(--muted-foreground)]"}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm ${!n.read ? "font-semibold text-[var(--foreground)]" : "font-medium"}`}>{n.title}</p>
                    <span className="text-xs text-[var(--muted-foreground)] flex-shrink-0">{timeAgo(n.created_at)}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{n.body}</p>
                  {clickable && (
                    <p className="mt-1 text-xs text-[#2f6664] font-medium">Click to view →</p>
                  )}
                </div>
                {!n.read && (
                  <div className="mt-2 h-2 w-2 rounded-full bg-[#b77a45] flex-shrink-0" />
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
