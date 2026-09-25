"use client";

import { signUp } from "@/actions/auth/sign-up-action";
import { AccountFields } from "@/components/auth/account-fields";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { SignUpFormData, signUpSchema } from "../schema/sign-up.schema";

// Creates an account together with the organization it owns.
export default function SignUpForm() {
  const t = useTranslations("auth.signUp");
  const router = useRouter();
  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { organization: "", name: "", lastName: "", email: "", password: "", consent: false as never },
  });

  const mutation = useMutation({
    mutationFn: async (data: SignUpFormData) => {
      const result = await signUp(data);

      if ("error" in result) {
        throw new Error(t(`errors.${result.error}`));
      }
    },
    onSuccess: () => {
      router.push("/dashboard");
      router.refresh();
    },
    onError: (error) => toast({ title: t("errorTitle"), description: error.message, variant: "destructive" }),
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="flex w-full flex-col gap-4">
        <FormField
          name="organization"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("organization")}</FormLabel>
              <FormControl>
                <Input autoComplete="organization" placeholder={t("organizationPlaceholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <AccountFields control={form.control} />
        <Button type="submit" size="lg" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("submit")}
        </Button>
      </form>
    </Form>
  );
}
