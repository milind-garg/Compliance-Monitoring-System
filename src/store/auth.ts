import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "inspector" | "manager" | "viewer";
  mine_id?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        localStorage.setItem("access_token", token);
        set({ user, token });
      },
      logout: () => {
        localStorage.removeItem("access_token");
        set({ user: null, token: null });
      },
    }),
    { name: "auth-store", partialize: (s) => ({ user: s.user, token: s.token }) }
  )
);
