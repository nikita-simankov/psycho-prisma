"use client";

import { saveReportDraft, saveReportVersion } from "@/actions/report/report-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Check, CloudOff, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type Status = "idle" | "saving" | "saved" | "error";

const SAVE_DELAY = 1000;

// Pending saves, so saving a version can wait for the text typed just before.
const flushers = new Set<() => Promise<void>>();

// Background and conclusion, saved as they are typed. Kept in one component so both
// fields save together.
export function useReportDraft(userId: string, initial: { background: string; conclusion: string }) {
  const [values, setValues] = useState(initial);
  const [status, setStatus] = useState<Status>("idle");
  const latest = useRef(values);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    if (!dirty.current) return;
    dirty.current = false;
    setStatus("saving");
    try {
      await saveReportDraft(userId, latest.current);
      setStatus("saved");
    } catch {
      dirty.current = true;
      setStatus("error");
    }
  }, [userId]);

  const update = (field: "background" | "conclusion", value: string) => {
    latest.current = { ...latest.current, [field]: value };
    setValues(latest.current);
    dirty.current = true;
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, SAVE_DELAY);
  };

  useEffect(() => {
    flushers.add(flush);
    const onHide = () => document.visibilityState === "hidden" && void flush();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    return () => {
      flushers.delete(flush);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
    };
  }, [flush]);

  return { values, update, status, flush };
}

export function SaveStatus({ status }: { status: Status }) {
  const t = useTranslations("report");
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground print:hidden" aria-live="polite">
      {status === "saving" && (
        <>
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> {t("saving")}
        </>
      )}
      {status === "saved" && (
        <>
          <Check className="h-3 w-3" aria-hidden /> {t("saved")}
        </>
      )}
      {status === "error" && (
        <span className="flex items-center gap-1 text-destructive">
          <CloudOff className="h-3 w-3" aria-hidden /> {t("notSaved")}
        </span>
      )}
    </span>
  );
}

// A text area that grows with its content and prints as plain text.
export function ReportField({
  id,
  label,
  hint,
  value,
  onChange,
  status,
}: {
  id: string;
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
  status: Status;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.height = "auto";
    ref.current.style.height = `${ref.current.scrollHeight + 2}px`;
  }, [value]);

  return (
    <section id={id} aria-labelledby={`${id}-label`} className="flex scroll-mt-20 flex-col gap-2 rounded-xl border bg-card p-4 sm:p-6 print:border-0 print:p-0">
      <div className="flex items-center justify-between gap-2">
        <label id={`${id}-label`} htmlFor={`${id}-input`} className="text-lg font-semibold">
          {label}
        </label>
        <SaveStatus status={status} />
      </div>
      <Textarea
        ref={ref}
        id={`${id}-input`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={hint}
        rows={4}
        className="resize-none overflow-hidden text-base leading-relaxed print:hidden"
      />
      <p className="hidden whitespace-pre-line leading-relaxed print:block">{value || "—"}</p>
    </section>
  );
}

// The editable report parts, placed around the results by the page.
export function ReportEditor({
  userId,
  initial,
  children,
}: {
  userId: string;
  initial: { background: string; conclusion: string };
  children: React.ReactNode;
}) {
  const t = useTranslations("report");
  const draft = useReportDraft(userId, initial);

  return (
    <>
      <ReportField
        id="background"
        label={t("background")}
        hint={t("backgroundHint")}
        value={draft.values.background}
        onChange={(value) => draft.update("background", value)}
        status={draft.status}
      />
      {children}
      <ReportField
        id="conclusion"
        label={t("conclusion")}
        hint={t("conclusionHint")}
        value={draft.values.conclusion}
        onChange={(value) => draft.update("conclusion", value)}
        status={draft.status}
      />
    </>
  );
}

export function SaveVersionButton({ userId }: { userId: string }) {
  const t = useTranslations("report");
  const common = useTranslations("common");
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <Button
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          await Promise.all(Array.from(flushers, (flush) => flush()));
          const { version } = await saveReportVersion(userId);
          toast({ title: t("versionSaved", { version }) });
          router.refresh();
        } catch {
          toast({ title: common("error"), description: t("versionError"), variant: "destructive" });
        } finally {
          setPending(false);
        }
      }}
    >
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {t("saveVersion")}
    </Button>
  );
}
