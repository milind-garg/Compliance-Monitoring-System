"use client";
import { Bell, Search } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { Input } from "@/components/ui/input";

export function Topbar() {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="flex h-14 items-center justify-between border-b border-[var(--border)] bg-white px-6 flex-shrink-0">
      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
        <Input className="pl-9" placeholder="Search mines, violations…" />
      </div>

      <div className="flex items-center gap-4">
        <button className="relative rounded-full p-1.5 hover:bg-[var(--muted)] transition-colors">
          <Bell className="h-5 w-5 text-[var(--muted-foreground)]" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[var(--danger)]" />
        </button>

        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-xs font-bold">
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
