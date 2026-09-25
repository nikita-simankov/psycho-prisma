"use client";

import { deleteArchiveEntry } from "@/actions/summary/delete-archive-entry";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export default function DeleteEntryButton({ summaryId }: { summaryId: string }) {
  const t = useTranslations("archive");
  const common = useTranslations("common");
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: () => deleteArchiveEntry(summaryId),
    onSuccess: () => {
      toast({ title: t("deletedTitle"), description: t("deletedText") });
      router.refresh();
    },
    onError: () => toast({ title: common("error"), variant: "destructive" }),
  });

  return (
    <Button
      size="sm"
      variant="destructive"
      disabled={mutation.isPending}
      onClick={() => mutation.mutate()}
    >
      {common("delete")}
    </Button>
  );
}
