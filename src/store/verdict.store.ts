import { create } from "zustand";

export interface VerdictStore {
  value: string;
  setValue: (text: string) => void;
}

export const useVerdictStore = create<VerdictStore>()((set) => ({
  value: "",
  setValue: (text: string) =>
    set(() => ({
      value: text,
    })),
}));
