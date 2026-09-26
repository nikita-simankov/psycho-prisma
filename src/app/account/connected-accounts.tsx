"use client";

import { disconnectProvider } from "@/actions/account/account-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

type Provider = "google" | "microsoft";

// Google and Microsoft accounts this person can sign in with.
export function ConnectedAccounts({
  available,
  connected,
  notice,
}: {
  available: Provider[];
  connected: { provider: string; email: string }[];
  notice: "connected" | "taken" | null;
}) {
  const t = useTranslations("account.connected");
  const common = useTranslations("common");
  const router = useRouter();
  const disconnect = useMutation({
    mutationFn: disconnectProvider,
    onSuccess: () => router.refresh(),
    onError: () => toast({ title: common("error"), variant: "destructive" }),
  });
  const providers = Array.from(new Set<string>([...available, ...connected.map((entry) => entry.provider)])) as Provider[];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("title")}</CardTitle>
        <CardDescription>{t("text")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {notice && (
          <p className={notice === "taken" ? "text-sm text-destructive" : "text-sm text-muted-foreground"} role="status">
            {t(`notice.${notice}`)}
          </p>
        )}
        <ul className="divide-y border-y">
          {providers.map((provider) => {
            const account = connected.find((entry) => entry.provider === provider);
            return (
              <li key={provider} className="flex items-center gap-3 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{t(`providers.${provider}`)}</span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {account ? account.email : t("notConnected")}
                  </span>
                </span>
                {account ? (
                  <Button variant="outline" size="sm" disabled={disconnect.isPending} onClick={() => disconnect.mutate(provider)}>
                    {t("disconnect")}
                  </Button>
                ) : (
                  available.includes(provider) && (
                    <Button asChild variant="outline" size="sm">
                      <a href={`/auth/oauth/${provider}?next=/account?oauth=connected`}>{t("connect")}</a>
                    </Button>
                  )
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
