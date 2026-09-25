"use client";

import { deleteSchedule, setScheduleActive } from "@/actions/round/round-actions";
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
import { toast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export function ScheduleControls({ id, active, name }: { id: string; active: boolean; name: string }) {
  const t = useTranslations("rounds");
  const common = useTranslations("common");
  const router = useRouter();
  const onError = () => toast({ title: common("error"), variant: "destructive" });

  const toggle = useMutation({ mutationFn: () => setScheduleActive(id, !active), onSuccess: () => router.refresh(), onError });
  const remove = useMutation({ mutationFn: () => deleteSchedule(id), onSuccess: () => router.refresh(), onError });

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" disabled={toggle.isPending} onClick={() => toggle.mutate()}>
        {t(active ? "pause" : "resume")}
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
            {t("stopRepeating")}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("stopTitle", { name })}</AlertDialogTitle>
            <AlertDialogDescription>{t("stopText")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{common("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => remove.mutate()}>{t("stopRepeating")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
