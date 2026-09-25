"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

export default function OrganizationError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("errors");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <AlertTriangle className="h-10 w-10 text-destructive" aria-hidden />
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="max-w-md text-sm text-muted-foreground">{t("text")}</p>
        {error.digest && <p className="text-xs text-muted-foreground">{t("reference", { digest: error.digest })}</p>}
      </div>
      <Button onClick={reset}>{t("retry")}</Button>
    </div>
  );
}
