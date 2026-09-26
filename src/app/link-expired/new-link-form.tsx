"use client";

import { requestNewRoundLink } from "@/actions/round/link-request-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { MailCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

// Asks for a fresh round link by email.
export function NewLinkForm() {
  const t = useTranslations("assessments.linkExpired");
  const [email, setEmail] = useState("");
  const mutation = useMutation({ mutationFn: () => requestNewRoundLink(email) });
  const result = mutation.data;

  if (result && "ok" in result) {
    return (
      <p role="status" className="flex items-start gap-2 rounded-lg border bg-card p-4 text-sm">
        <MailCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
        {t("sent")}
      </p>
    );
  }

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate();
      }}
    >
      <Label htmlFor="new-link-email">{t("emailLabel")}</Label>
      <Input id="new-link-email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      {result && "error" in result && (
        <p role="alert" className="text-sm text-destructive">
          {t(`errors.${result.error}`)}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {t("send")}
      </Button>
    </form>
  );
}
