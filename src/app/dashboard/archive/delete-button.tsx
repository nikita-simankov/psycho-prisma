"use client";

import { deleteArchiveEntry } from "@/actions/summary/delete-archive-entry";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";

export default function DeleteEntryButton({
  summaryId,
}: {
  summaryId: string;
}) {
  const mutation = useMutation({
    mutationFn: () => deleteArchiveEntry(summaryId),

    onSuccess: () => {
      toast({
        title: "Удалено",
        description: "Вы успешно удалили заключение из архива",
      });
      location.reload();
    },
  });

  return (
    <Button
      size="sm"
      variant="destructive"
      className="w-1/2"
      onClick={() => mutation.mutate()}
    >
      Удалить
    </Button>
  );
}
