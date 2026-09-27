"use client";

import { previewFeedback, sendFeedback, type FeedbackPreview } from "@/actions/hiring/feedback-actions";
import { createReportShare, revokeReportShare } from "@/actions/hiring/share-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { Copy, HeartHandshake, Link2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Same range as SHARE_MIN_DAYS to SHARE_MAX_DAYS in src/utils/share-links.ts, which is server-only.
const DAY_OPTIONS = [1, 3, 7, 14, 30];

export type ShareRow = {
  id: string;
  recipient: string;
  state: "active" | "expired" | "revoked" | "locked";
  expiresAt: Date;
  views: number;
  lastViewedAt: Date | null;
};

function copy(text: string, done: string) {
  navigator.clipboard.writeText(text).then(
    () => toast({ title: done }),
    () => toast({ title: text })
  );
}

function CopyField({ id, label, value, copied, mono }: { id: string; label: string; value: string; copied: string; mono?: boolean }) {
  const t = useTranslations("hiring.share");
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input id={id} readOnly value={value} className={mono ? "font-mono text-lg tracking-[0.3em]" : "font-mono text-xs"} onFocus={(event) => event.target.select()} />
        <Button type="button" variant="outline" onClick={() => copy(value, copied)} aria-label={t("copyLabel", { what: label })}>
          <Copy className="h-4 w-4" />
          {t("copy")}
        </Button>
      </div>
    </div>
  );
}

// Makes a share link to this candidate's report, then shows the link and its code once.
export function ShareDialog({ userId }: { userId: string }) {
  const t = useTranslations("hiring.share");
  const common = useTranslations("common");
  const format = useFormatter();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState(7);
  const [recipient, setRecipient] = useState("");
  const [includeConclusion, setIncludeConclusion] = useState(true);
  const [created, setCreated] = useState<{ link: string; code: string; expiresAt: Date } | null>(null);

  const create = useMutation({
    mutationFn: async () => {
      const result = await createReportShare({ userId, days, recipient, includeConclusion });
      if ("error" in result) throw new Error(t(`errors.${result.error}`));
      return result;
    },
    onSuccess: (result) => {
      setCreated(result);
      router.refresh();
    },
    onError: (error) => toast({ title: error instanceof Error && error.message ? error.message : common("error"), variant: "destructive" }),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          // The link and code are gone once the dialog closes; only their hashes were stored.
          setCreated(null);
          setRecipient("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Link2 className="h-4 w-4" />
          {t("button")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle>{t("createdTitle")}</DialogTitle>
              <DialogDescription>{t("createdText")}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <CopyField id="share-link" label={t("link")} value={created.link} copied={t("copied")} />
              <CopyField id="share-code" label={t("code")} value={created.code} copied={t("copied")} mono />
              <p className="text-sm text-muted-foreground">{t("expires", { date: format.dateTime(new Date(created.expiresAt), { dateStyle: "medium", timeStyle: "short" }) })}</p>
            </div>
            <DialogFooter>
              <Button onClick={() => setOpen(false)}>{t("done")}</Button>
            </DialogFooter>
          </>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              create.mutate();
            }}
          >
            <DialogHeader>
              <DialogTitle>{t("title")}</DialogTitle>
              <DialogDescription>{t("description")}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="share-recipient">{t("recipient")}</Label>
              <Input id="share-recipient" value={recipient} maxLength={120} placeholder={t("recipientPlaceholder")} onChange={(event) => setRecipient(event.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="share-days">{t("days")}</Label>
              <Select value={String(days)} onValueChange={(value) => setDays(Number(value))}>
                <SelectTrigger id="share-days" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAY_OPTIONS.map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {t("daysOption", { count: option })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label className="flex cursor-pointer items-center gap-3 text-sm">
              <Checkbox checked={includeConclusion} onCheckedChange={(checked) => setIncludeConclusion(checked === true)} />
              {t("includeConclusion")}
            </label>
            <DialogFooter>
              <Button type="submit" disabled={create.isPending}>
                {t("create")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

const STATE_VARIANT = { active: "success", expired: "outline", revoked: "outline", locked: "warning" } as const;

// The links made to this report, each revocable while it still works.
export function ShareList({ shares }: { shares: ShareRow[] }) {
  const t = useTranslations("hiring.share");
  const common = useTranslations("common");
  const format = useFormatter();
  const router = useRouter();
  const revoke = useMutation({
    mutationFn: revokeReportShare,
    onSuccess: () => {
      toast({ title: t("revoked") });
      router.refresh();
    },
    onError: () => toast({ title: common("error"), variant: "destructive" }),
  });

  if (shares.length === 0) return null;

  return (
    <ul className="divide-y border-y">
      {shares.map((share) => {
        const recipient = share.recipient || t("noRecipient");
        return (
          <li key={share.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3" data-share={share.state}>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                {recipient}
                <Badge variant={STATE_VARIANT[share.state]}>{t(`state.${share.state}`)}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {[
                  t("expires", { date: format.dateTime(share.expiresAt, { dateStyle: "medium" }) }),
                  t("views", { count: share.views }),
                  share.lastViewedAt ? t("lastViewed", { date: format.dateTime(share.lastViewedAt, { dateStyle: "medium" }) }) : "",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            {(share.state === "active" || share.state === "locked") && (
              <Button variant="outline" size="sm" disabled={revoke.isPending} aria-label={t("revokeLabel", { recipient })} onClick={() => revoke.mutate(share.id)}>
                {t("revoke")}
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// Prepares the strengths email, shows exactly what the candidate will read, then sends it.
export function FeedbackDialog({ userId, name }: { userId: string; name: string }) {
  const t = useTranslations("hiring.feedback");
  const common = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [preview, setPreview] = useState<FeedbackPreview | null>(null);
  // The note the preview was made with; sending waits until the preview shows the current one.
  const [previewedNote, setPreviewedNote] = useState<string | null>(null);

  const load = useMutation({
    mutationFn: async (text: string) => {
      const result = await previewFeedback(userId, text);
      if ("error" in result) throw new Error(t(`errors.${result.error}`));
      return { result, text };
    },
    onSuccess: ({ result, text }) => {
      setPreview(result);
      setPreviewedNote(text);
    },
    onError: (error) => toast({ title: error instanceof Error && error.message ? error.message : common("error"), variant: "destructive" }),
  });
  const send = useMutation({
    mutationFn: async () => {
      const result = await sendFeedback({ userId, note });
      if ("error" in result) throw new Error(t(`errors.${result.error}`));
      return result;
    },
    onSuccess: ({ emailed }) => {
      toast({ title: emailed ? t("sent", { name }) : t("notEmailed") });
      setOpen(false);
      router.refresh();
    },
    onError: (error) => toast({ title: error instanceof Error && error.message ? error.message : common("error"), variant: "destructive" }),
  });
  const current = previewedNote === note.trim();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setNote("");
          setPreview(null);
          load.mutate("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <HeartHandshake className="h-4 w-4" />
          {t("button")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("previewTitle", { name })}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        {preview ? (
          <article aria-label={t("previewLabel")} data-feedback-preview className="flex flex-col gap-3 rounded-lg border bg-background p-4 text-sm">
            <p className="font-mono text-xs text-muted-foreground">
              {t("to", { email: preview.to })}
              <br />
              {t("subject", { subject: preview.subject })}
            </p>
            <p className="font-heading text-xl">{preview.heading}</p>
            {preview.paragraphs.map((paragraph, index) => (
              <p key={index} className="leading-relaxed">
                {paragraph}
              </p>
            ))}
            {previewedNote && <p className="whitespace-pre-line border-l-2 pl-3 font-heading italic text-muted-foreground">{previewedNote}</p>}
            {preview.notes.map((line, index) => (
              <p key={index} className="text-xs text-muted-foreground">
                {line}
              </p>
            ))}
          </article>
        ) : (
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
        )}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="feedback-note">{t("note")}</Label>
          <Textarea id="feedback-note" rows={3} maxLength={1000} value={note} placeholder={t("notePlaceholder")} onChange={(event) => setNote(event.target.value)} />
        </div>
        <DialogFooter className="gap-2">
          {!current && (
            <Button variant="outline" disabled={load.isPending} onClick={() => load.mutate(note.trim())}>
              {t("refresh")}
            </Button>
          )}
          <Button disabled={!preview || !current || send.isPending} onClick={() => send.mutate()}>
            {t("send")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
