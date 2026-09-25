"use client";

import { acceptInvitation } from "@/actions/invitation/accept-invitation-action";
import { AccountFields } from "@/components/auth/account-fields";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { accountSchema, AccountFormData } from "@/app/auth/sign-up/schema/sign-up.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

function useAccept(token: string) {
  const t = useTranslations("invite");
  const router = useRouter();

  return useMutation({
    mutationFn: async (data?: AccountFormData) => {
      const result = await acceptInvitation(token, data);

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

export function AcceptInvitationForm({
  token,
  invitation,
}: {
  token: string;
  invitation: { organization: string; email: string; name: string; lastName: string };
}) {
  const t = useTranslations("invite");
  const mutation = useAccept(token);
  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: invitation.name,
      lastName: invitation.lastName,
      email: invitation.email,
      password: "",
      consent: false as never,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="flex w-full flex-col gap-4">
        <AccountFields control={form.control} fixedEmail={invitation.email} />
        <Button type="submit" size="lg" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("accept", { organization: invitation.organization })}
        </Button>
      </form>
    </Form>
  );
}

export function JoinButton({ token, organization }: { token: string; organization: string }) {
  const t = useTranslations("invite");
  const mutation = useAccept(token);

  return (
    <Button size="lg" onClick={() => mutation.mutate(undefined)} disabled={mutation.isPending}>
      {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {t("accept", { organization })}
    </Button>
  );
}
