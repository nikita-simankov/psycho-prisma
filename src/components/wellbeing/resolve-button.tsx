"use client";

import { resolveCareFlag, resolveWellbeingAlert } from "@/actions/wellbeing/wellbeing-actions";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

// Marks an early warning or a care follow-up as handled.
export function ResolveButton({ kind, id, label }: { kind: "alert" | "care"; id: string; label: string }) {
  const t = useTranslations("wellbeing");
  const common = useTranslations("common");
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: () => (kind === "alert" ? resolveWellbeingAlert(id) : resolveCareFlag(id)),
    onSuccess: () => {
      toast({ title: t(kind === "alert" ? "alerts.resolved" : "care.resolved") });
      router.refresh();
    },
    onError: () => toast({ title: common("error"), variant: "destructive" }),
  });

  return (
    <Button type="button" size="sm" variant="outline" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
      <Check className="size-4" aria-hidden />
      {label}
    </Button>
  );
}
