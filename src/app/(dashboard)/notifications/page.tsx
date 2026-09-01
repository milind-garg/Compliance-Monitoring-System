"use client";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertTriangle, ShieldCheck, ClipboardList } from "lucide-react";

const notifications = [
  { id: "1", icon: AlertTriangle, iconColor: "text-red-500", title: "Critical violation at Jharia Block-A", body: "Dust suppression system failure detected by AI sensor monitoring.", time: "10 min ago", read: false, type: "CRITICAL" },
  { id: "2", icon: ClipboardList, iconColor: "text-orange-500", title: "Inspection due in 2 days", body: "Scheduled inspection for Raniganj North is due on 03 Sep 2026.", time: "1 hr ago", read: false, type: "REMINDER" },
  { id: "3", icon: ShieldCheck, iconColor: "text-green-500", title: "Violation resolved", body: "Training record violation at Dhanbad East has been marked resolved.", time: "3 hrs ago", read: true, type: "INFO" },
  { id: "4", icon: Bell, iconColor: "text-blue-500", title: "New inspection report available", body: "August compliance report for Singrauli Zone-3 is ready for review.", time: "Yesterday", read: true, type: "INFO" },
];

export default function NotificationsPage() {
  return (
    <div>
      <PageHeader title="Notifications" description="System alerts and compliance updates" />
      <Card>
        <CardContent className="p-0 divide-y divide-[var(--border)]">
          {notifications.map((n) => {
            const Icon = n.icon;
            return (
              <div
                key={n.id}
                className={`flex items-start gap-4 px-4 py-4 hover:bg-[var(--muted)] cursor-pointer transition-colors ${!n.read ? "bg-blue-50/50" : ""}`}
              >
                <div className={`mt-0.5 flex-shrink-0 ${n.iconColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm ${!n.read ? "font-semibold" : "font-medium"}`}>{n.title}</p>
                    <span className="text-xs text-[var(--muted-foreground)] flex-shrink-0">{n.time}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{n.body}</p>
                </div>
                {!n.read && (
                  <div className="mt-2 h-2 w-2 rounded-full bg-[var(--primary)] flex-shrink-0" />
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
