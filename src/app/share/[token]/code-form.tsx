"use client";

import { openSharedReport } from "@/actions/hiring/share-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

// The recipient types the 6-digit code they were given apart from the link.
export function CodeForm({ token, locked }: { token: string; locked: boolean }) {
  const t = useTranslations("hiring.shared");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(locked ? t("errors.locked") : null);

  const open = useMutation({
    mutationFn: () => openSharedReport(token, code),
    onSuccess: (result) => {
      // A right code sets a cookie, and Next.js then renders the page again with the report.
      if ("error" in result) setError(t(`errors.${result.error}`));
    },
    onError: () => setError(t("errors.tooMany")),
  });

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        open.mutate();
      }}
    >
      <Label htmlFor="access-code">{t("codeLabel")}</Label>
      <Input
        id="access-code"
        value={code}
        onChange={(event) => setCode(event.target.value)}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={11}
        className="w-48 font-mono text-lg tracking-[0.3em]"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "access-code-error" : undefined}
      />
      {error && (
        <p id="access-code-error" role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" className="w-fit" disabled={open.isPending || code.replace(/\D/g, "").length !== 6}>
        {t("open")}
      </Button>
    </form>
  );
}
