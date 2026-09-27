"use client";

import { previewDigest } from "@/actions/wellbeing/wellbeing-actions";
import { Section } from "@/components/page-templates";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import { useTranslations } from "next-intl";

// This week's leadership digest exactly as the person looking would receive it.
export function DigestPreview() {
  const t = useTranslations("settings.digest");
  const common = useTranslations("common");
  const preview = useMutation({
    mutationFn: () => previewDigest(),
    onError: () => toast({ title: common("error"), variant: "destructive" }),
  });

  return (
    <Section
      title={t("previewTitle")}
      description={preview.data ? t("previewSubject", { subject: preview.data.subject }) : t("previewText")}
      actions={
        <Button type="button" variant="outline" disabled={preview.isPending} onClick={() => preview.mutate()}>
          <Eye className="size-4" />
          {t("preview")}
        </Button>
      }
    >
      {preview.data && (
        <div className="max-w-2xl overflow-hidden rounded-lg border bg-white">
          <iframe title={t("previewTitle")} srcDoc={preview.data.html} sandbox="" className="h-[36rem] w-full" />
        </div>
      )}
    </Section>
  );
}
