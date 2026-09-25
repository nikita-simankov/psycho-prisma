"use client";

import GrowingTextarea from "./growing-textarea";
import { useNoteStore } from "@/store/notes.store";

export default function AdditionalNotes() {
  const { value, setValue } = useNoteStore((state) => state);

  return <GrowingTextarea text={value} setText={setValue} />;
}
