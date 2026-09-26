"use client";

import { removeSampleWorkspace } from "@/actions/onboarding/onboarding-actions";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

// A line above every page of a sample workspace, so fictional people are never mistaken for real ones.
export function SampleBanner({ canDelete }: { canDelete: boolean }) {
  const t = useTranslations("sample");
  const common = useTranslations("common");
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b bg-accent/50 px-4 py-2 text-sm sm:px-6 lg:px-8 print:hidden"
    >
      <span>{confirming ? t("deleteConfirm") : t("banner")}</span>
      {canDelete && (
        <span className="flex gap-3">
          {confirming && (
            <button type="button" className="text-muted-foreground underline underline-offset-2" onClick={() => setConfirming(false)}>
              {common("cancel")}
            </button>
          )}
          <button
            type="button"
            disabled={pending}
            className="font-medium text-primary underline underline-offset-2 disabled:opacity-60"
            onClick={() => {
              if (!confirming) {
                setConfirming(true);
                return;
              }
              startTransition(async () => {
                const { redirectTo } = await removeSampleWorkspace();
                router.push(redirectTo);
                router.refresh();
              });
            }}
          >
            {t("delete")}
          </button>
        </span>
      )}
    </div>
  );
}
