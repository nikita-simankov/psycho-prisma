"use client";

import { signIn } from "@/actions/auth/sign-in-action";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PasswordInput } from "@/components/ui/password-input";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { SignInFormData, signInSchema } from "../schema/sign-in.schema";

export default function SignInForm() {
  const router = useRouter();
  // Only same-site paths, so the link cannot send people elsewhere.
  const next = useSearchParams().get("next");
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : null;
  const t = useTranslations("auth.signIn");
  const fields = useTranslations("profile.fields");
  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),

    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const signInMutation = useMutation({
    mutationFn: async (formValues: SignInFormData) => {
      const result = await signIn(formValues);

      if ("error" in result) {
        throw new Error(t(`errors.${result.error}`));
      }

      return result;
    },

    onSuccess: (data) => {
      router.push(safeNext ?? data.redirectTo);
      router.refresh();
    },

    onError: (error) => {
      toast({
        title: t("errorTitle"),
        variant: "destructive",
        description: error.message,
      });

      form.resetField("password");
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data: SignInFormData) =>
          signInMutation.mutate(data)
        )}
        className="w-full flex flex-col gap-4"
      >
        <FormField
          name="identifier"
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex flex-col gap-1">
              <FormLabel>{t("identifier")}</FormLabel>
              <FormControl>
                <Input autoComplete="username" placeholder={fields("emailPlaceholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="password"
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex flex-col gap-1">
              <FormLabel className="flex flex-row items-center justify-between">
                {fields("password")}
                <Link href="/auth/forgot-password" className="text-sm font-normal text-primary hover:underline">
                  {t("forgot")}
                </Link>
              </FormLabel>
              <FormControl>
                <PasswordInput autoComplete="current-password" placeholder="• • • • • •" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={signInMutation.isPending}>
          {t("submit")}
        </Button>
        <div className="self-center flex flex-row items-center gap-2 text-sm">
          <span className="text-muted-foreground">{t("noAccount")}</span>
          <Link
            href="/auth/sign-up"
            className="font-medium text-primary hover:underline"
          >
            {t("signUpLink")}
          </Link>
        </div>
      </form>
    </Form>
  );
}
