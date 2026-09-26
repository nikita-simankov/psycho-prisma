"use client";

import { joinOrganization } from "@/actions/invitation/join-link-actions";
import { accountSchema, type AccountFormData } from "@/app/auth/sign-up/schema/sign-up.schema";
import { AccountFields } from "@/components/auth/account-fields";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

function useJoin(token: string) {
  const t = useTranslations("join");
  const router = useRouter();

  return useMutation({
    mutationFn: async (data?: AccountFormData) => {
      const result = await joinOrganization(token, data);
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
}

export function JoinForm({ token, organization }: { token: string; organization: string }) {
  const t = useTranslations("join");
  const mutation = useJoin(token);
  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: { name: "", lastName: "", email: "", password: "", consent: false as never },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="flex w-full flex-col gap-4">
        <AccountFields control={form.control} />
        <Button type="submit" size="lg" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("join", { organization })}
        </Button>
      </form>
    </Form>
  );
}

export function JoinButton({ token, organization }: { token: string; organization: string }) {
  const t = useTranslations("join");
  const mutation = useJoin(token);

  return (
    <Button size="lg" onClick={() => mutation.mutate(undefined)} disabled={mutation.isPending}>
      {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {t("join", { organization })}
    </Button>
  );
}
