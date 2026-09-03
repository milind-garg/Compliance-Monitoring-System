export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--primary)] to-[#0d2440]">
      {children}
    </div>
  );
}
