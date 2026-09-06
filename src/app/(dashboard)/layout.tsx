"use client";
import { useAuthStore } from "@/store/auth";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { canAccess } from "@/lib/rbac";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const role = useAuthStore((s) => s.user?.role);
  const router = useRouter();
  const pathname = usePathname();
  // Wait for Zustand persist to rehydrate before checking auth
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) { router.replace("/login"); return; }
    if (!canAccess(role, pathname)) router.replace("/dashboard");
  }, [hydrated, token, role, pathname, router]);

  if (!hydrated) return null;
  if (!token) return null;
  if (!canAccess(role, pathname)) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">{children}</main>
      </div>
    </div>
  );
}
