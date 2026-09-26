"use client";

import { resendVerification } from "@/actions/auth/verification-action";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

// A line above staff pages until the email address is confirmed. Invitations and rounds wait for it.
export function VerifyEmailBanner({ email }: { email: string }) {
  const t = useTranslations("verifyEmail");
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "sent" | "notSent" | "rateLimited">("idle");

  function resend() {
    startTransition(async () => {
      const result = await resendVerification();
      setStatus("error" in result ? "rateLimited" : result.emailed ? "sent" : "notSent");
    });
  }

  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b bg-accent/50 px-4 py-2 text-sm sm:px-6 lg:px-8 print:hidden"
    >
      <span>{status === "idle" ? t("banner", { email }) : t(status)}</span>
      <button
        type="button"
        onClick={resend}
        disabled={pending || status === "sent"}
        className="font-medium text-primary underline underline-offset-2 disabled:opacity-60"
      >
        {t("resend")}
      </button>
    </div>
  );
}
