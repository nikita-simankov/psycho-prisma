"use client";

import { resetPassword } from "@/actions/auth/password-reset-action";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { toast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations("auth.reset");
  const validation = useTranslations("validation");
  const router = useRouter();
  const [password, setPassword] = useState("");
  const tooShort = password.length > 0 && password.length < 8;

  const mutation = useMutation({
    mutationFn: async () => {
      const result = await resetPassword(token, password);

      if ("error" in result) {
        throw new Error(t(`errors.${result.error}`));
      }

      return result;
    },
    onSuccess: ({ redirectTo }) => {
      router.push(redirectTo);
      router.refresh();
    },
    onError: (error) => toast({ title: t("errorTitle"), description: error.message, variant: "destructive" }),
  });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (password.length >= 8) mutation.mutate();
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">{t("newPassword")}</Label>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={tooShort}
          aria-describedby="password-hint"
        />
        <p id="password-hint" className={tooShort ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
          {validation("passwordLength")}
        </p>
      </div>
      <Button type="submit" size="lg" disabled={mutation.isPending || password.length < 8}>
        {t("submit")}
      </Button>
    </form>
  );
}
