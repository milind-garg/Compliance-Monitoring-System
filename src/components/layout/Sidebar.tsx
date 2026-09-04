"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShieldCheck,
  AlertTriangle,
  ClipboardList,
  Map,
  Brain,
  BarChart2,
  Bell,
  Users,
  LogOut,
  HardHat,
  Briefcase,
  TrendingUp,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/compliance", label: "Compliance", icon: ShieldCheck },
  { href: "/violations", label: "Violations", icon: AlertTriangle },
  { href: "/inspections", label: "Inspections", icon: ClipboardList },
  { href: "/maps", label: "Mine Maps", icon: Map },
  { href: "/ai-insights", label: "AI Insights", icon: Brain },
  { href: "/reports", label: "Reports", icon: BarChart2 },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/contractors", label: "Contractors", icon: Briefcase },
  { href: "/production", label: "Production", icon: TrendingUp },
  { href: "/users", label: "User Mgmt", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const logout = useAuthStore((s) => s.logout);

  return (
    <aside className="flex h-screen w-56 flex-col bg-[var(--sidebar-bg)] text-[var(--sidebar-fg)] flex-shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-white/10">
        <HardHat className="h-6 w-6 text-[var(--accent)]" />
        <span className="text-sm font-bold leading-tight">
          Khanan<br />
          <span className="text-[var(--accent)] font-semibold">Bodh</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-white/15 text-white font-medium"
                  : "text-[var(--sidebar-muted)] hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-white/10 p-2">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-[var(--sidebar-muted)] hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
