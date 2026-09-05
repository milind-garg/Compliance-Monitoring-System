"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth";
import Link from "next/link";

const schema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirm_password: z.string(),
  organisation_name: z.string().min(2, "Organisation name required"),
  organisation_code: z.string().min(1, "Organisation code required"),
  role: z.enum(["admin", "manager", "inspector", "viewer"]),
}).refine((d) => d.password === d.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});
type FormData = z.infer<typeof schema>;

function PwInput({ label, name, register, error }: { label: string; name: "password" | "confirm_password"; register: any; error?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <div className="relative">
        <Input type={show ? "text" : "password"} placeholder="••••••••" {...register(name)} className="pr-10" />
        <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-[var(--danger)]">{error}</p>}
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError("");
    try {
      const { authApi } = await import("@/lib/services");
      const { data: tokens } = await authApi.post("/v1/auth/register", data);
      localStorage.setItem("access_token", tokens.access_token);
      const { data: me } = await authApi.get("/v1/users/me");
      setAuth(
        { id: me.id, name: me.full_name, email: me.email, role: me.role.toUpperCase() as never },
        tokens.access_token
      );
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Registration failed. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="rounded-xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-[#b77a45] shadow-lg bg-white hover:scale-105 transition-transform">
            <Image
              src="/logo.png"
              alt="Khanan Bodh Logo"
              fill
              sizes="112px"
              className="object-contain p-1.5"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#172126] mt-1">Create Account</h1>
          <p className="text-xs text-[#b77a45] font-semibold tracking-wider uppercase">Khanan Bodh · Coal India Limited Company</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Full Name</label>
            <Input placeholder="John Doe" {...register("full_name")} />
            {errors.full_name && <p className="mt-1 text-xs text-[var(--danger)]">{errors.full_name.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Email</label>
            <Input type="email" placeholder="you@example.com" {...register("email")} />
            {errors.email && <p className="mt-1 text-xs text-[var(--danger)]">{errors.email.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Organisation Name</label>
              <Input placeholder="Acme Mining Co." {...register("organisation_name")} />
              {errors.organisation_name && <p className="mt-1 text-xs text-[var(--danger)]">{errors.organisation_name.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Organisation Code</label>
              <Input placeholder="ORG-001" {...register("organisation_code")} />
              {errors.organisation_code && <p className="mt-1 text-xs text-[var(--danger)]">{errors.organisation_code.message}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Role</label>
            <select
              {...register("role")}
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--secondary)]"
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="inspector">Inspector</option>
              <option value="viewer">Viewer</option>
            </select>
            {errors.role && <p className="mt-1 text-xs text-[var(--danger)]">{errors.role.message}</p>}
          </div>

          <PwInput label="Password" name="password" register={register} error={errors.password?.message} />
          <PwInput label="Confirm Password" name="confirm_password" register={register} error={errors.confirm_password?.message} />

          {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-[var(--danger)]">{error}</div>}

          <Button type="submit" variant="secondary" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? "Creating account…" : "Create Account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[#2f6664] hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
