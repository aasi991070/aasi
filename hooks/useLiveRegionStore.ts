import { create } from "zustand";

type LiveRegionStore = {
  message: string;
  announce: (message: string) => void;
};

export const useLiveRegionStore = create<LiveRegionStore>((set) => ({
  message: "",
  announce: (message) => {
    set({ message: "" });
    requestAnimationFrame(() => set({ message }));
  },
}));
