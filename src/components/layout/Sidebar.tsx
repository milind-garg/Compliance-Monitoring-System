"use client";
import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShieldCheck,
  AlertTriangle,
  ClipboardList,
  Map,
  Brain,
  BarChart2,
  ScanText,
  ShieldAlert,
  MapPin,
  Bell,
  Users,
  LogOut,
  HardHat,
  Briefcase,
  TrendingUp,
  Settings,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { useSidebarStore } from "@/store/sidebar";
import { canAccess } from "@/lib/rbac";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/compliance", label: "Compliance", icon: ShieldCheck },
  { href: "/violations", label: "Violations", icon: AlertTriangle },
  { href: "/inspections", label: "Inspections", icon: ClipboardList },
  { href: "/mines", label: "Mines", icon: HardHat },
  { href: "/maps", label: "Mine Maps", icon: Map },
  { href: "/ai-insights", label: "AI Insights", icon: Brain },
  { href: "/reports", label: "Reports", icon: BarChart2 },
  { href: "/ocr", label: "OCR Parser", icon: ScanText },
  { href: "/ppe-check", label: "PPE Check", icon: ShieldAlert },
  { href: "/worker-tracking", label: "Worker Tracking", icon: MapPin },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/contractors", label: "Contractors", icon: Briefcase },
  { href: "/production", label: "Production", icon: TrendingUp },
  { href: "/users", label: "User Mgmt", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const logout = useAuthStore((s) => s.logout);
  const role = useAuthStore((s) => s.user?.role);
  const { isCollapsed, toggleSidebar } = useSidebarStore();
  const visibleItems = navItems.filter((item) => canAccess(role, item.href));

  // Keyboard shortcut: Ctrl+B or Cmd+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  return (
    <aside
      className={cn(
        "flex h-screen flex-col bg-[var(--sidebar-bg)] text-[var(--sidebar-fg)] flex-shrink-0 border-r border-white/10 transition-all duration-300 ease-in-out relative z-40 select-none",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center border-b border-white/10 px-3.5 py-3 h-[72px] min-h-[72px]">
        <Link
          href="/dashboard"
          title="Khanan Bodh · Coal India Limited Company"
          className={cn(
            "flex items-center gap-3 overflow-hidden transition-all duration-200 group rounded-lg w-full",
            isCollapsed ? "justify-center" : ""
          )}
        >
          <div className="relative h-12 w-12 shrink-0 rounded-full overflow-hidden border-2 border-[#b77a45] shadow-md bg-white group-hover:border-[#d4975d] group-hover:scale-105 transition-all">
            <Image
              src="/logo.png"
              alt="Khanan Bodh Seal"
              fill
              sizes="48px"
              className="object-contain p-0.5"
              priority
            />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 transition-opacity duration-200">
              <span className="text-base font-bold tracking-tight text-white leading-tight truncate">
                Khanan Bodh
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-[#b77a45] mt-0.5 truncate">
                Coal India Limited Company
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-1 scrollbar-thin">
        {visibleItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={isCollapsed ? label : undefined}
              className={cn(
                "group relative flex items-center rounded-lg text-sm transition-all duration-150",
                isCollapsed
                  ? "justify-center h-11 w-full px-0"
                  : "gap-3 px-3 py-2.5",
                active
                  ? "bg-[#2f6664] text-white font-medium shadow-sm"
                  : "text-[var(--sidebar-muted)] hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-110",
                  active ? "text-white" : "text-[var(--sidebar-muted)] group-hover:text-white"
                )}
              />
              {!isCollapsed ? (
                <span className="truncate">{label}</span>
              ) : (
                /* Floating Tooltip on Hover for Collapsed Mode */
                <span className="pointer-events-none absolute left-full ml-3 z-50 hidden rounded-md bg-[#172126] px-2.5 py-1 text-xs font-medium text-white shadow-xl border border-white/10 whitespace-nowrap group-hover:block group-hover:animate-in group-hover:fade-in-50 group-hover:zoom-in-95">
                  {label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer & Sign out */}
      <div className="border-t border-white/10 p-2">
        <button
          onClick={logout}
          title={isCollapsed ? "Sign out" : undefined}
          className={cn(
            "group relative flex w-full items-center rounded-lg text-sm text-[var(--sidebar-muted)] hover:bg-red-500/15 hover:text-red-400 transition-colors",
            isCollapsed ? "justify-center h-11 px-0" : "gap-3 px-3 py-2.5"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0 group-hover:text-red-400" />
          {!isCollapsed ? (
            <span className="truncate">Sign out</span>
          ) : (
            <span className="pointer-events-none absolute left-full ml-3 z-50 hidden rounded-md bg-[#172126] px-2.5 py-1 text-xs font-medium text-red-300 shadow-xl border border-white/10 whitespace-nowrap group-hover:block">
              Sign out
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}

