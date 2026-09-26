"use client";

import { useEffect, useRef } from "react";

type Handlers = {
  // 1–9 pick the matching answer.
  onDigit?: (digit: number) => void;
  onEnter?: () => void;
  onBack?: () => void;
};

// Keyboard answering. Keys typed into a text field, or with a modifier held, are left alone.
export function useRunnerKeys(handlers: Handlers) {
  const ref = useRef(handlers);
  // Always call the latest handlers without re-attaching the listener.
  useEffect(() => {
    ref.current = handlers;
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable=true]")) return;

      const { onDigit, onEnter, onBack } = ref.current;
      if (/^[1-9]$/.test(event.key) && onDigit) {
        event.preventDefault();
        onDigit(Number(event.key));
      } else if (event.key === "Enter" && onEnter && !target?.closest("button, a")) {
        event.preventDefault();
        onEnter();
      } else if (event.key === "Backspace" && onBack) {
        event.preventDefault();
        onBack();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
