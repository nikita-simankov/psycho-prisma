"use client";

import { discardInstrumentDraft, publishInstrument } from "@/actions/studio/studio-actions";
import { SaveStatus } from "@/app/[org]/reports/[userId]/report-editor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import type { InstrumentKind, Issue } from "@/utils/instrument-content";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SaveState } from "./use-instrument-draft";

// A human sentence for each thing that stops publishing.
export function useIssueText() {
  const t = useTranslations("studio.issues");
  return (issue: Issue) => t(issue.code, { question: issue.question ?? 0, choice: issue.choice ?? 0, scale: issue.scale ?? 0, row: issue.row ?? 0 });
}

export function IssueList({ issues }: { issues: Issue[] }) {
  const t = useTranslations("studio");
  const text = useIssueText();

  if (issues.length === 0) {
    return (
      <p className="flex items-center gap-2 rounded-lg border bg-card p-3 text-sm">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden />
        {t("ready")}
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-warning/40 bg-warning/5 p-3 text-sm">
      <p className="mb-1.5 flex items-center gap-2 font-medium">
        <AlertTriangle className="h-4 w-4 shrink-0 text-warning" aria-hidden />
        {t("issuesTitle", { count: issues.length })}
      </p>
      <ul className="ml-6 list-disc space-y-0.5 text-muted-foreground">
        {issues.slice(0, 8).map((issue, index) => (
          <li key={index}>{text(issue)}</li>
        ))}
        {issues.length > 8 && <li>{t("moreIssues", { count: issues.length - 8 })}</li>}
      </ul>
    </div>
  );
}

// Save state, publish and discard, shared by the test and questionnaire editors.
export function StudioToolbar({
  kind,
  id,
  version,
  status,
  hasDraft,
  issues,
  flush,
  backHref,
}: {
  kind: InstrumentKind;
  id: string;
  version: number;
  status: SaveState;
  hasDraft: boolean;
  issues: Issue[];
  flush: () => Promise<void>;
  backHref: string;
}) {
  const t = useTranslations("studio");
  const common = useTranslations("common");
  const router = useRouter();
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);

  const publish = useMutation({
    mutationFn: async () => {
      await flush();
      const result = await publishInstrument(kind, id, note);
      if ("error" in result) throw new Error(result.error);
      return result.version;
    },
    onSuccess: (published) => {
      toast({ title: t("published", { version: published }) });
      setOpen(false);
      router.push(backHref);
      router.refresh();
    },
    onError: (error) => toast({ title: common("error"), description: t(`errors.${error.message}` as "errors.invalid"), variant: "destructive" }),
  });

  const discard = useMutation({
    mutationFn: () => discardInstrumentDraft(kind, id),
    onSuccess: (result) => {
      router.push(result.deleted ? backHref.replace(/\/[^/]+$/, "") : backHref);
      router.refresh();
    },
  });

  return (
    <div className="sticky top-0 z-20 -mx-4 flex flex-wrap items-center justify-between gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted-foreground">{version === 0 ? t("unpublished") : t("editingVersion", { version })}</span>
        <SaveStatus status={status} />
      </div>
      <div className="flex flex-wrap gap-2">
        {(hasDraft || version === 0) && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost">{version === 0 ? t("deleteDraft") : t("discard")}</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{version === 0 ? t("deleteDraftTitle") : t("discardTitle")}</AlertDialogTitle>
                <AlertDialogDescription>{version === 0 ? t("deleteDraftText") : t("discardText")}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{common("cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={() => discard.mutate()}>{version === 0 ? t("deleteDraft") : t("discard")}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button disabled={issues.length > 0 || !hasDraft}>{t("publish")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("publishTitle", { version: version + 1 })}</DialogTitle>
              <DialogDescription>{version === 0 ? t("publishFirstText") : t("publishText")}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="publish-note">{t("note")}</Label>
              <Textarea id="publish-note" maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} placeholder={t("notePlaceholder")} />
            </div>
            <DialogFooter>
              <Button onClick={() => publish.mutate()} disabled={publish.isPending}>
                {t("publish")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
