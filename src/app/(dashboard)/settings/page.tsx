"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth";

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-2">
      <span className="text-sm">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? "bg-[var(--primary)]" : "bg-[var(--muted)]"}`}
      >
        <span className={`mt-0.5 ml-0.5 inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`} />
      </button>
    </label>
  );
}

function Section({ title, description, children, onSave, saving }: {
  title: string; description: string; children: React.ReactNode;
  onSave: () => void; saving: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4">
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="text-sm text-[var(--muted-foreground)]">{description}</p>
        </div>
        <div className="space-y-3">{children}</div>
        <div className="mt-5 flex justify-end">
          <Button size="sm" onClick={onSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);

  const [name, setName] = useState(user?.name ?? "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState("");

  const [notifs, setNotifs] = useState({ emailViolations: true, emailInspections: true, inAppAlerts: true, weeklyDigest: false });
  const [notifSaving, setNotifSaving] = useState(false);

  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [themeSaving, setThemeSaving] = useState(false);

  const saveProfile = async () => {
    setProfileSaving(true);
    setProfileMsg("");
    try {
      const { authApi } = await import("@/lib/services");
      await authApi.patch("/v1/users/me", { full_name: name });
      if (user && token) setAuth({ ...user, name }, token);
      setProfileMsg("Profile updated.");
    } catch {
      setProfileMsg("Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  const savePassword = async () => {
    if (newPw.length < 8) { setPwMsg("Password must be at least 8 characters."); return; }
    setPwSaving(true);
    setPwMsg("");
    try {
      const { authApi } = await import("@/lib/services");
      await authApi.post("/v1/auth/change-password", { current_password: currentPw, new_password: newPw });
      setCurrentPw(""); setNewPw("");
      setPwMsg("Password changed successfully.");
    } catch {
      setPwMsg("Failed to change password. Check your current password.");
    } finally {
      setPwSaving(false);
    }
  };

  const saveNotifs = async () => {
    setNotifSaving(true);
    await new Promise((r) => setTimeout(r, 600)); // optimistic — no backend endpoint yet
    setNotifSaving(false);
  };

  const saveTheme = async () => {
    setThemeSaving(true);
    document.documentElement.setAttribute("data-theme", theme === "system" ? "" : theme);
    localStorage.setItem("theme", theme);
    await new Promise((r) => setTimeout(r, 300));
    setThemeSaving(false);
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
          {profileMsg && <p className="text-sm text-[var(--muted-foreground)]">{profileMsg}</p>}
        </Section>

        {/* Password */}
        <Section title="Change Password" description="Update your login password" onSave={savePassword} saving={pwSaving}>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Current Password</label>
            <Input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className="max-w-sm" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">New Password</label>
            <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="max-w-sm" placeholder="Min. 8 characters" />
          </div>
          {pwMsg && <p className="text-sm text-[var(--muted-foreground)]">{pwMsg}</p>}
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
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium capitalize transition-colors ${theme === t ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] hover:bg-[var(--muted)]"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
