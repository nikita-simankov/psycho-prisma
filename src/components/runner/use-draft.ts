"use client";

import { saveDraft } from "@/actions/draft/draft-actions";
import { useCallback, useEffect, useRef, useState } from "react";

export type Answer = number | string;
export type SaveStatus = "idle" | "saving" | "saved" | "error";

const SAVE_DELAY = 800;

// Answers, per-question timing and autosave to the server. Time is counted from when a
// question (or page) appears, or from the previous answer, until the answer is given.
export function useDraft({
  kind,
  instrumentId,
  assignmentId,
  initial,
}: {
  kind: "test" | "form";
  instrumentId: string;
  assignmentId?: string;
  initial?: { answers: Record<string, Answer>; timings: Record<string, number> } | null;
}) {
  const [answers, setAnswers] = useState<Record<string, Answer>>(initial?.answers ?? {});
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timings = useRef<Record<string, number>>(initial?.timings ?? {});
  const answersRef = useRef(answers);
  const mark = useRef(Date.now());
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const dirty = useRef(false);

  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    if (!dirty.current) return;
    dirty.current = false;
    setStatus("saving");
    try {
      await saveDraft(kind, instrumentId, { answers: answersRef.current, timings: timings.current, assignmentId });
      setStatus("saved");
    } catch {
      dirty.current = true;
      setStatus("error");
    }
  }, [kind, instrumentId, assignmentId]);

  const schedule = useCallback(() => {
    dirty.current = true;
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, SAVE_DELAY);
  }, [flush]);

  // Starts the clock for a newly shown question or page.
  const restartClock = useCallback(() => {
    mark.current = Date.now();
  }, []);

  const answer = useCallback(
    (questionId: number, value: Answer, { timed = true } = {}) => {
      if (timed) {
        const now = Date.now();
        timings.current = { ...timings.current, [questionId]: (timings.current[questionId] ?? 0) + (now - mark.current) };
        mark.current = now;
      }
      answersRef.current = { ...answersRef.current, [questionId]: value };
      setAnswers(answersRef.current);
      schedule();
    },
    [schedule]
  );

  // Save straight away when the tab is hidden or closed.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
      clearTimeout(timer.current);
    };
  }, [flush]);

  return { answers, answer, status, flush, restartClock, timings };
}
