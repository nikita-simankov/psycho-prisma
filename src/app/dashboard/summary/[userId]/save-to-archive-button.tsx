"use client";

import { createArchiveEntryAction } from "@/actions/summary/create-archive-entry";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useNoteStore } from "@/store/notes.store";
import { useVerdictStore } from "@/store/verdict.store";
import { useMutation } from "@tanstack/react-query";

interface Properties {
  userId: string;
}

export default function SaveToArchiveButton(props: Readonly<Properties>) {
  const { value: verdict } = useVerdictStore((state) => state);
  const { value: notes } = useNoteStore((state) => state);

  const mutation = useMutation({
    mutationFn: () => createArchiveEntryAction(props.userId, verdict, notes),

    onSuccess: () => {
      toast({
        title: "Успех",
        description: "Характеристика успешно добавлена в архив",
      });
    },
  });

  return <Button onClick={() => mutation.mutate()}>Архивировать</Button>;
}
