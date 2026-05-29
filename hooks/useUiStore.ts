import { create } from "zustand";
import { toast } from "sonner";

interface UiStore {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  showToast: (
    message: string,
    type?: "success" | "error" | "info"
  ) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  showToast: (message, type = "info") => {
    if (type === "success") toast.success(message);
    else if (type === "error") toast.error(message);
    else toast.info(message);
  },
}));
