"use client";
import { useState } from "react";
import Image from "next/image";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError("");
    try {
      const { authApi } = await import("@/lib/services");
      await authApi.post("/v1/auth/forgot-password", { email });
    } catch {
      // swallow — always show success to prevent email enumeration
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="rounded-xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="relative mb-2 h-28 w-28 overflow-hidden rounded-full border-2 border-[#b77a45] bg-white shadow-lg hover:scale-105 transition-transform">
            <Image
              src="/logo.png"
              alt="Khanan Bodh Logo"
              fill
              sizes="112px"
              className="object-contain p-1.5"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#172126]">Forgot Password</h1>
          <p className="text-xs text-[#b77a45] font-semibold tracking-wider uppercase -mt-1">Khanan Bodh · Coal India Limited Company</p>
          <p className="text-sm text-[var(--muted-foreground)]">
            Enter your email and we&apos;ll send a reset link
          </p>
        </div>

        {submitted ? (
          <div className="rounded-md bg-green-50 px-4 py-4 text-sm text-green-800">
            If this email exists, a reset link has been sent. Check your inbox.
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-[var(--danger)]">{error}</div>}
            <Button type="submit" variant="secondary" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Sending…" : "Send Reset Link"}
            </Button>
          </form>
        )}

        <div className="mt-6 flex justify-center">
          <Link href="/login" className="flex items-center gap-1.5 text-sm text-[#2f6664] font-medium hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
