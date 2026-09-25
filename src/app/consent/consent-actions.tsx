"use client";

import { acceptConsent } from "@/actions/user/accept-consent-action";
import { logout } from "@/actions/auth/logout.action";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export function ConsentActions() {
  const t = useTranslations("consent");
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: () => acceptConsent(),
    onSuccess: () => {
      router.replace("/assessments");
      router.refresh();
    },
    onError: () => toast({ title: t("error"), variant: "destructive" }),
  });

  return (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <form action={logout}>
        <Button type="submit" variant="ghost" size="lg" className="w-full">
          {t("decline")}
        </Button>
      </form>
      <Button size="lg" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {t("accept")}
      </Button>
    </div>
  );
}
