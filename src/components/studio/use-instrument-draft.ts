"use client";

import { saveInstrumentDraft } from "@/actions/studio/studio-actions";
import type { InstrumentKind } from "@/utils/instrument-content";
import { useCallback, useEffect, useRef, useState } from "react";

export type SaveState = "idle" | "saving" | "saved" | "error";

const SAVE_DELAY = 900;

// The studio's working copy, saved to the server as it changes.
export function useInstrumentDraft<T>(kind: InstrumentKind, id: string, initial: T, initiallyDirty: boolean) {
  const [content, setContent] = useState(initial);
  const [status, setStatus] = useState<SaveState>("idle");
  const [hasDraft, setHasDraft] = useState(initiallyDirty);
  const latest = useRef(content);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    if (!dirty.current) return;
    dirty.current = false;
    setStatus("saving");
    try {
      await saveInstrumentDraft(kind, id, latest.current);
      setStatus("saved");
      setHasDraft(true);
    } catch {
      dirty.current = true;
      setStatus("error");
    }
  }, [kind, id]);

  const update = useCallback(
    (next: T | ((current: T) => T)) => {
      latest.current = typeof next === "function" ? (next as (current: T) => T)(latest.current) : next;
      setContent(latest.current);
      dirty.current = true;
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, SAVE_DELAY);
    },
    [flush]
  );

  useEffect(() => {
    const onHide = () => document.visibilityState === "hidden" && void flush();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
    };
  }, [flush]);

  return { content, update, status, flush, hasDraft, setHasDraft };
}
