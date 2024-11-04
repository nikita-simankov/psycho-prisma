import { create } from "zustand";

export interface NoteStore {
  value: string;
  setValue: (text: string) => void;
}

export const useNoteStore = create<NoteStore>()((set) => ({
  value: "",
  setValue: (text: string) =>
    set(() => ({
      value: text,
    })),
}));
