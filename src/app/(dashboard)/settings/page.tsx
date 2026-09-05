"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth";
import { authApi } from "@/lib/services";
import { Skeleton } from "@/components/ui/skeleton";

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-2">
      <span className="text-sm">{label}</span>
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? "bg-[#2f6664]" : "bg-[var(--stone)]"}`}>
        <span className={`mt-0.5 ml-0.5 inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`} />
      </button>
    </label>
  );
}

function Section({ title, description, children, onSave, saving, footer }: {
  title: string; description: string; children: React.ReactNode;
  onSave?: () => void; saving?: boolean; footer?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4">
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="text-sm text-[var(--muted-foreground)]">{description}</p>
        </div>
        <div className="space-y-3">{children}</div>
        {(onSave || footer) && (
          <div className="mt-5 flex justify-end gap-2">
            {footer}
            {onSave && (
              <Button size="sm" variant="secondary" onClick={onSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);
  const isAdmin = user?.role?.toLowerCase() === "admin";

  // Profile
  const [name, setName] = useState(user?.name ?? "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Password
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Notifications
  const [notifs, setNotifs] = useState({ emailViolations: true, emailInspections: true, inAppAlerts: true, weeklyDigest: false });
  const [notifSaving, setNotifSaving] = useState(false);

  // Theme
  const [theme, setTheme] = useState<"light" | "dark" | "system">(
    () => (typeof window !== "undefined" ? (localStorage.getItem("theme") as any) : null) ?? "system"
  );
  const [themeSaving, setThemeSaving] = useState(false);

  // Mine count (admin)
  const { data: mines = [], isLoading: loadingMines } = useQuery({
    queryKey: ["mines"],
    queryFn: () => authApi.get("/v1/mines/").then(r => r.data as { id: string }[]),
    enabled: isAdmin,
  });

  // ── handlers ─────────────────────────────────────────────────────────────
  const saveProfile = async () => {
    setProfileSaving(true); setProfileMsg(null);
    try {
      await authApi.patch("/v1/users/me", { full_name: name });
      if (user && token) setAuth({ ...user, name }, token);
      setProfileMsg({ ok: true, text: "Profile updated." });
    } catch {
      setProfileMsg({ ok: false, text: "Failed to update profile." });
    } finally { setProfileSaving(false); }
  };

  const savePassword = async () => {
    if (newPw.length < 8) { setPwMsg({ ok: false, text: "Password must be at least 8 characters." }); return; }
    setPwSaving(true); setPwMsg(null);
    try {
      await authApi.post("/v1/auth/change-password", { current_password: currentPw, new_password: newPw });
      setCurrentPw(""); setNewPw("");
      setPwMsg({ ok: true, text: "Password changed successfully." });
    } catch {
      setPwMsg({ ok: false, text: "Failed to change password. Check your current password." });
    } finally { setPwSaving(false); }
  };

  const saveNotifs = async () => {
    setNotifSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setNotifSaving(false);
  };

  const saveTheme = () => {
    setThemeSaving(true);
    document.documentElement.setAttribute("data-theme", theme === "system" ? "" : theme);
    localStorage.setItem("theme", theme);
    setTimeout(() => setThemeSaving(false), 300);
  };

  return (
    <div>
      <PageHeader title="Settings" description="Manage your account and preferences" />

      <div className="space-y-6">
        {/* Profile */}
        <Section title="Profile" description="Update your display name" onSave={saveProfile} saving={profileSaving}>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Full Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="max-w-sm" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Email</label>
            <Input value={user?.email ?? ""} disabled className="max-w-sm bg-[var(--muted)]" />
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">Email cannot be changed.</p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Role</label>
            <Input value={user?.role ?? ""} disabled className="max-w-sm bg-[var(--muted)] capitalize" />
          </div>
          {profileMsg && (
            <p className={`text-sm ${profileMsg.ok ? "text-green-600" : "text-[var(--danger)]"}`}>{profileMsg.text}</p>
          )}
        </Section>

        {/* Password */}
        <Section title="Change Password" description="Update your login password" onSave={savePassword} saving={pwSaving}>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Current Password</label>
            <Input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className="max-w-sm" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">New Password</label>
            <div className="relative max-w-sm">
              <Input type={showNewPw ? "text" : "password"} value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Min. 8 characters" className="pr-10" />
              <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {pwMsg && (
            <p className={`text-sm ${pwMsg.ok ? "text-green-600" : "text-[var(--danger)]"}`}>{pwMsg.text}</p>
          )}
        </Section>

        {/* Notifications */}
        <Section title="Notifications" description="Choose what you receive alerts for" onSave={saveNotifs} saving={notifSaving}>
          <div className="divide-y divide-[var(--border)]">
            <Toggle checked={notifs.emailViolations} onChange={(v) => setNotifs({ ...notifs, emailViolations: v })} label="Email: New Violations" />
            <Toggle checked={notifs.emailInspections} onChange={(v) => setNotifs({ ...notifs, emailInspections: v })} label="Email: Inspection Updates" />
            <Toggle checked={notifs.inAppAlerts} onChange={(v) => setNotifs({ ...notifs, inAppAlerts: v })} label="In-App: Real-time Alerts" />
            <Toggle checked={notifs.weeklyDigest} onChange={(v) => setNotifs({ ...notifs, weeklyDigest: v })} label="Email: Weekly Digest" />
          </div>
        </Section>

        {/* Appearance */}
        <Section title="Appearance" description="Choose your preferred theme" onSave={saveTheme} saving={themeSaving}>
          <div className="flex gap-3">
            {(["light", "dark", "system"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setTheme(t)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium capitalize transition-colors ${theme === t ? "border-[#2f6664] bg-[#2f6664] text-white" : "border-[var(--border)] hover:bg-[var(--stone)]/50"}`}>
                {t}
              </button>
            ))}
          </div>
        </Section>

        {/* Organisation info — admin only */}
        {isAdmin && (
          <Section title="Organisation" description="Overview of your organisation's mine sites (admin only)">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Mine sites registered</label>
              {loadingMines ? (
                <Skeleton className="h-5 w-48" />
              ) : (
                <p className="text-sm text-[var(--muted-foreground)]">
                  {(mines as any[]).length} mine{(mines as any[]).length !== 1 ? "s" : ""} active in the system.
                  Manage mines from the <a href="/mines" className="text-[#2f6664] font-medium hover:underline">Mines</a> portal.
                </p>
              )}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
