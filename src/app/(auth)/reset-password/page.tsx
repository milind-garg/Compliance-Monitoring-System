"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HardHat, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

function PwField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <div className="relative">
        <Input type={show ? "text" : "password"} placeholder="••••••••" value={value} onChange={(e) => onChange(e.target.value)} className="pr-10" />
        <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (!token) { setError("Invalid reset link — token missing"); return; }
    setLoading(true);
    setError("");
    try {
      const { authApi } = await import("@/lib/services");
      await authApi.post("/v1/auth/reset-password", { token, new_password: password });
      router.push("/login");
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Reset failed. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-xl bg-white p-8 shadow-2xl">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)]">
            <HardHat className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">Reset Password</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Enter your new password</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <PwField label="New Password" value={password} onChange={setPassword} />
          <PwField label="Confirm Password" value={confirm} onChange={setConfirm} />
          {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-[var(--danger)]">{error}</div>}
          <Button type="submit" className="w-full" disabled={loading || !token}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Resetting…" : "Reset Password"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
          <Link href="/login" className="text-[var(--primary)] hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
