import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidebarState {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isCollapsed: false,
      toggleSidebar: () => set((s) => ({ isCollapsed: !s.isCollapsed })),
      setCollapsed: (isCollapsed: boolean) => set({ isCollapsed }),
    }),
    {
      name: "khanan-bodh-sidebar",
    }
  )
);
