"use client";

import { useEffect } from "react";

// Folded sections marked data-print-open are opened for printing and folded back afterwards.
export function PrintExpander() {
  useEffect(() => {
    let opened: HTMLDetailsElement[] = [];
    const before = () => {
      opened = Array.from(document.querySelectorAll<HTMLDetailsElement>("details[data-print-open]:not([open])"));
      opened.forEach((element) => (element.open = true));
    };
    const after = () => opened.forEach((element) => (element.open = false));
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, []);

  return null;
}
