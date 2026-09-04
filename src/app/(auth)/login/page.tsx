"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { HardHat, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth";
import Link from "next/link";

const MAX_ATTEMPTS = 5;

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const locked = attempts >= MAX_ATTEMPTS;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    if (locked) return;
    setError("");
    try {
      const { authApi } = await import("@/lib/services");
      const { data: tokens } = await authApi.post("/v1/auth/login", {
        email: data.email,
        password: data.password,
      });
      const storage = data.rememberMe ? localStorage : sessionStorage;
      storage.setItem("access_token", tokens.access_token);
      localStorage.setItem("access_token", tokens.access_token); // always set for interceptor
      const { data: me } = await authApi.get("/v1/users/me");
      setAuth(
        { id: me.id, name: me.full_name, email: me.email, role: me.role.toUpperCase() as never },
        tokens.access_token
      );
      router.push("/dashboard");
    } catch {
      const next = attempts + 1;
      setAttempts(next);
      if (next >= MAX_ATTEMPTS) {
        setError("Account temporarily locked after 5 failed attempts. Please try again later or reset your password.");
      } else {
        setError(`Invalid credentials. ${MAX_ATTEMPTS - next} attempt${MAX_ATTEMPTS - next === 1 ? "" : "s"} remaining.`);
      }
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-xl bg-white p-8 shadow-2xl">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)]">
            <HardHat className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">Khanan Bodh</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Email</label>
            <Input type="email" placeholder="you@example.com" {...register("email")} />
            {errors.email && <p className="mt-1 text-xs text-[var(--danger)]">{errors.email.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Password</label>
            <div className="relative">
              <Input type={showPw ? "text" : "password"} placeholder="••••••••" {...register("password")} className="pr-10" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-[var(--danger)]">{errors.password.message}</p>}
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] cursor-pointer select-none">
              <input type="checkbox" {...register("rememberMe")} className="h-3.5 w-3.5 rounded border-gray-300 accent-[var(--primary)]" />
              Remember me
            </label>
            <Link href="/forgot-password" className="text-xs text-[var(--primary)] hover:underline">Forgot password?</Link>
          </div>

          {error && (
            <div className={`rounded-md px-3 py-2 text-sm ${locked ? "bg-orange-50 text-orange-700" : "bg-red-50 text-[var(--danger)]"}`}>
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting || locked}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {locked ? "Account locked" : isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-[var(--primary)] hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}
