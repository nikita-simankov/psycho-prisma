"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { Control, FieldValues, Path } from "react-hook-form";

type AccountValues = { name: string; lastName: string; email: string; password: string; consent: boolean };

// Name, email, password and privacy consent, shared by sign-up and invitations.
// With a fixed email (from an invitation) the field is shown but not editable.
export function AccountFields<T extends FieldValues & AccountValues>({
  control,
  fixedEmail,
}: {
  control: Control<T>;
  fixedEmail?: string;
}) {
  const t = useTranslations("profile.fields");
  const messages = useTranslations("auth.signUp");

  const text = (name: "name" | "lastName" | "email", autoComplete: string, className = "") => (
    <FormField
      name={name as Path<T>}
      control={control}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{t(name)}</FormLabel>
          <FormControl>
            <Input
              autoComplete={autoComplete}
              type={name === "email" ? "email" : "text"}
              placeholder={name === "email" ? t("emailPlaceholder") : undefined}
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {text("name", "given-name")}
        {text("lastName", "family-name")}
      </div>
      {fixedEmail ? (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">{t("email")}</span>
          <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm">{fixedEmail}</p>
        </div>
      ) : (
        text("email", "email")
      )}
      <FormField
        name={"password" as Path<T>}
        control={control}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("password")}</FormLabel>
            <FormControl>
              <PasswordInput autoComplete="new-password" placeholder="• • • • • • • •" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        name={"consent" as Path<T>}
        control={control}
        render={({ field }) => (
          <FormItem>
            <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  className="mt-0.5"
                />
              </FormControl>
              <FormLabel className="text-sm font-normal leading-snug">
                {messages.rich("consent", {
                  link: (chunks) => (
                    <Link href="/privacy" target="_blank" className="font-medium text-primary underline-offset-4 hover:underline">
                      {chunks}
                    </Link>
                  ),
                })}
              </FormLabel>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
