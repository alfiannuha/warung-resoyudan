import { create } from "zustand";

interface UIStore {
  isSideNavOpen: boolean;
  toggleSideNav: () => void;
  closeSideNav: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isSideNavOpen: false,
  toggleSideNav: () => set((s) => ({ isSideNavOpen: !s.isSideNavOpen })),
  closeSideNav: () => set({ isSideNavOpen: false }),
}));
