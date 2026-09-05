export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#172126] via-[#1c2a30] to-[#2f6664] p-4">
      {children}
    </div>
  );
}
