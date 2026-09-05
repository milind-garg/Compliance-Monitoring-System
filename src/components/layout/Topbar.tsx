"use client";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Bell, Search, AlertTriangle, ClipboardList, ShieldCheck, Check, ExternalLink, PanelLeft, PanelLeftClose } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { useSidebarStore } from "@/store/sidebar";
import { Input } from "@/components/ui/input";
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
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Demo data (used when notification API returns empty results) ──────────────
const now = new Date();
const mins = (n: number) => new Date(now.getTime() - n * 60000).toISOString();
const hrs  = (n: number) => new Date(now.getTime() - n * 3600000).toISOString();
const days = (n: number) => new Date(now.getTime() - n * 86400000).toISOString();

const DEMO_NOTIFICATIONS: NotificationItem[] = [
  { id: "n1", title: "🚨 Critical Violation: Methane Overconcentration",      body: "Face 14-C, North Shaft — methane at 1.4% TLV. Evacuation completed. Action required.",                               read: false, entity_type: "violation",  entity_id: "v1", created_at: mins(12) },
  { id: "n2", title: "⚠️ Safety Inspection Overdue — Dhanbad North Pit",      body: "The scheduled safety inspection for Dhanbad North Pit is 2 days overdue.",                                            read: false, entity_type: "inspection", entity_id: "i4", created_at: hrs(2)  },
  { id: "n3", title: "Inspection Completed — Jharia Coalfield Alpha",          body: "September safety inspection complete. 3 violations recorded.",                                                      read: false, entity_type: "inspection", entity_id: "i1", created_at: hrs(4)  },
  { id: "n4", title: "Compliance Record Approved — Raniganj Central Block",    body: "Q2 FY 2025-26 compliance submission for Raniganj Central Block approved.",                                           read: true,  entity_type: "compliance", entity_id: "c2", created_at: hrs(6)  },
  { id: "n5", title: "New Violation Reported — Environmental (High Severity)", body: "Effluent discharge at Raniganj washery pond exceeds MOEF limit by 4.8x.",                                          read: false, entity_type: "violation",  entity_id: "v2", created_at: hrs(8)  },
  { id: "n6", title: "Inspection Scheduled — Raniganj Central Block",          body: "DGMS statutory inspection scheduled for 15 Sept 2026.",                                                             read: true,  entity_type: "inspection", entity_id: "i8", created_at: hrs(12) },
  { id: "n7", title: "Violation Resolved — Labour Overtime Breach",            body: "Violation V-004 (overtime breach, Bokaro Deep Mine) marked resolved.",                                              read: true,  entity_type: "violation",  entity_id: "v4", created_at: days(1) },
];

export function Topbar() {
  const router = useRouter();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { isCollapsed, toggleSidebar } = useSidebarStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: notifications = [], isLoading } = useQuery<NotificationItem[]>({
    queryKey: ["notifications"],
    queryFn: () => notificationApi.get("/v1/notifications/").then((r) => r.data),
    retry: false,
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationApi.put("/v1/notifications/read-all"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationApi.put(`/v1/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const displayNotifications = notifications.length > 0 ? notifications : DEMO_NOTIFICATIONS;
  const unreadCount = displayNotifications.filter((n) => !n.read).length;

  const handleItemClick = (n: NotificationItem) => {
    if (!n.read) markRead.mutate(n.id);
    setIsOpen(false);
    const route = n.entity_type ? ENTITY_ROUTES[n.entity_type] : null;
    if (route && n.entity_id) {
      router.push(`${route}/${n.entity_id}`);
    } else {
      router.push("/notifications");
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-[var(--border)] bg-white px-4 sm:px-6 flex-shrink-0 relative z-30">
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={toggleSidebar}
          title={isCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
          aria-label="Toggle sidebar"
          className="rounded-lg p-2 text-[var(--muted-foreground)] hover:bg-[var(--stone)]/60 hover:text-[var(--foreground)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--secondary)]"
        >
          {isCollapsed ? <PanelLeft className="h-5 w-5 text-[#2f6664]" /> : <PanelLeftClose className="h-5 w-5" />}
        </button>

        <div className="relative w-52 sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
          <Input
            className="pl-9"
            placeholder="Search mines, violations…"
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.currentTarget.value.trim()) {
                router.push(`/violations?search=${encodeURIComponent(e.currentTarget.value.trim())}`);
              }
            }}
          />
        </div>
      </div>

      {/* Center Brand (Khanan Bodh) - Big & Clearly Visible */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3 pointer-events-auto select-none">
        <div className="relative h-11 w-11 shrink-0 rounded-full overflow-hidden border-2 border-[#b77a45] shadow-md bg-white hover:scale-105 transition-transform">
          <Image
            src="/logo.png"
            alt="Khanan Bodh Logo"
            fill
            sizes="44px"
            className="object-contain p-0.5"
            priority
          />
        </div>
        <div className="flex flex-col items-start">
          <span className="text-xl sm:text-2xl font-black tracking-tight text-[#172126] leading-none">
            Khanan Bodh
          </span>
          <span className="hidden sm:block text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-[#b77a45] leading-none mt-1">
            Coal India Limited Company
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Button & Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            id="topbar-notification-button"
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label="Open notifications"
            className={`relative rounded-full p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--secondary)] ${
              isOpen ? "bg-[var(--stone)] text-[var(--foreground)]" : "text-[var(--muted-foreground)] hover:bg-[var(--stone)]/60 hover:text-[var(--foreground)]"
            }`}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c0392b] px-1 text-[10px] font-bold text-white shadow-xs">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown Popover */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--stone)]/30">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-[#2f6664]/15 px-2 py-0.5 text-xs font-semibold text-[#2f6664]">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllRead.mutate()}
                    disabled={markAllRead.isPending}
                    className="text-xs text-[var(--secondary)] font-medium hover:underline flex items-center gap-1 disabled:opacity-50"
                  >
                    <Check className="h-3 w-3" /> Mark all read
                  </button>
                )}
              </div>

              {/* Notification list */}
              <div className="max-h-[340px] overflow-y-auto divide-y divide-[var(--border)]">
                {displayNotifications.length === 0 ? (
                  <div className="py-8 text-center text-sm text-[var(--muted-foreground)]">
                    <Bell className="mx-auto h-7 w-7 opacity-30 mb-2" />
                    No notifications
                  </div>
                ) : (
                  displayNotifications.slice(0, 6).map((n) => {
                    const Icon = (n.entity_type && ENTITY_ICONS[n.entity_type]) ? ENTITY_ICONS[n.entity_type] : Bell;
                    return (
                      <div
                        key={n.id}
                        onClick={() => handleItemClick(n)}
                        className={`flex items-start gap-3 p-3.5 transition-colors cursor-pointer hover:bg-[var(--stone)]/50 ${
                          !n.read ? "bg-[#2f6664]/5" : ""
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            n.entity_type === "violation"
                              ? "bg-red-50 text-[#c0392b]"
                              : n.entity_type === "inspection"
                              ? "bg-[#2f6664]/15 text-[#2f6664]"
                              : "bg-[#b77a45]/15 text-[#b77a45]"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <p className={`text-xs leading-tight ${!n.read ? "font-semibold text-[var(--foreground)]" : "font-medium text-[var(--foreground)]/80"}`}>
                              {n.title}
                            </p>
                            <span className="text-[10px] text-[var(--muted-foreground)] shrink-0 whitespace-nowrap">
                              {timeAgo(n.created_at)}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)] line-clamp-1">
                            {n.body}
                          </p>
                        </div>
                        {!n.read && (
                          <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#b77a45]" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-[var(--border)] bg-[var(--stone)]/20 px-4 py-2.5 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    router.push("/notifications");
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2f6664] hover:underline"
                >
                  View all notifications <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-[var(--secondary)] flex items-center justify-center text-white text-xs font-bold shadow-xs">
            {user?.name?.[0] ?? "U"}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium leading-none">{user?.name ?? "User"}</p>
            <p className="text-xs text-[var(--muted-foreground)] capitalize">{user?.role?.toLowerCase() ?? "viewer"}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
