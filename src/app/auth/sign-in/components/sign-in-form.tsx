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
import { PhoneInput } from "@/components/ui/phone-input";
import { toast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { SignInFormData, signInSchema } from "../schema/sign-in.schema";

export default function SignInForm() {
  const router = useRouter();
  const t = useTranslations("auth.signIn");
  const fields = useTranslations("profile.fields");
  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),

    defaultValues: {
      phoneNumber: "",
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
      toast({
        title: t("successTitle"),
        description: t("successText"),
      });

      if (data.role === "admin") {
        router.push("/dashboard");
      } else {
        router.push("/forms");
      }
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
          name="phoneNumber"
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex flex-col gap-1">
              <FormLabel>{fields("phoneNumber")}</FormLabel>
              <FormControl>
                <PhoneInput
                  placeholder={fields("phonePlaceholder")}
                  international
                  {...field}
                />
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
              </FormLabel>
              <FormControl>
                <PasswordInput placeholder="• • • • • •" {...field} />
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
