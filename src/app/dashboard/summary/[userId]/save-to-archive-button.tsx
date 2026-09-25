"use client";

import { createArchiveEntryAction } from "@/actions/summary/create-archive-entry";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useNoteStore } from "@/store/notes.store";
import { useVerdictStore } from "@/store/verdict.store";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

interface Properties {
  userId: string;
}

export default function SaveToArchiveButton(props: Readonly<Properties>) {
  const t = useTranslations("reports");
  const common = useTranslations("common");
  const { value: verdict } = useVerdictStore((state) => state);
  const { value: notes } = useNoteStore((state) => state);

  const mutation = useMutation({
    mutationFn: () => createArchiveEntryAction(props.userId, verdict, notes),
    onSuccess: () => toast({ title: t("archivedTitle"), description: t("archivedText") }),
    onError: () =>
      toast({ title: common("error"), description: t("archiveError"), variant: "destructive" }),
  });

  return (
    <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
      {t("archive")}
    </Button>
  );
}
