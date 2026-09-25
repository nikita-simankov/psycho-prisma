"use client";

import { useVerdictStore } from "@/store/verdict.store";
import GrowingTextarea from "./growing-textarea";

export default function Verdict() {
  const { value, setValue } = useVerdictStore((state) => state);

  return <GrowingTextarea text={value} setText={setValue} />;
}
