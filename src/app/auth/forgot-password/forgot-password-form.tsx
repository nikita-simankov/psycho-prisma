"use client";

import { requestPasswordReset } from "@/actions/auth/password-reset-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { MailCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordForm() {
  const t = useTranslations("auth.forgot");
  const fields = useTranslations("profile.fields");
  const [email, setEmail] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const result = await requestPasswordReset(email);

      if ("error" in result) {
        throw new Error(t("rateLimited"));
      }
    },
    onError: (error) => toast({ title: t("errorTitle"), description: error.message, variant: "destructive" }),
  });

  if (mutation.isSuccess) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border bg-card p-5" role="status">
        <MailCheck className="h-6 w-6 text-success" />
        <div>
          <p className="font-medium">{t("sentTitle")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("sentText", { email })}</p>
        </div>
        <Link href="/auth/sign-in" className="text-sm font-medium text-primary hover:underline">
          {t("back")}
        </Link>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate();
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">{fields("email")}</Label>
        <Input
          id="email"
          type="email"
          required
          autoComplete="email"
          placeholder={fields("emailPlaceholder")}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <Button type="submit" size="lg" disabled={mutation.isPending}>
        {t("submit")}
      </Button>
      <Link href="/auth/sign-in" className="text-sm font-medium text-primary hover:underline">
        {t("back")}
      </Link>
    </form>
  );
}
