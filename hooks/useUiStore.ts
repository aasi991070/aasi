import { create } from "zustand";
import { toast } from "sonner";
import { useLiveRegionStore } from "@/hooks/useLiveRegionStore";

interface UiStore {
  /** Admin rail expanded vs. icon-only. Desktop (`lg` and up) only. */
  sidebarOpen: boolean;
  /** Admin nav drawer below `lg`. Separate from `sidebarOpen` because the two
   *  are different affordances: a collapsible rail and an overlay. */
  mobileNavOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setMobileNavOpen: (open: boolean) => void;
  showToast: (
    message: string,
    type?: "success" | "error" | "info"
  ) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  // Collapsed by default so the server-rendered markup matches the narrowest
  // viewport. V18Shell widens it on mount when a `lg` media query matches.
  sidebarOpen: false,
  mobileNavOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
  showToast: (message, type = "info") => {
    if (type === "success") toast.success(message);
    else if (type === "error") toast.error(message);
    else toast.info(message);

    useLiveRegionStore.getState().announce(message);
  },
}));
