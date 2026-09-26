"use client";

import { changePlan, openCustomerPortal } from "@/actions/billing/billing-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { useMutation } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export type CheckoutSettings = {
  token: string;
  environment: "sandbox" | "production";
  email: string;
  organizationId: string;
  successUrl: string;
};

// Opens Paddle's checkout overlay for a plan. Paddle takes the payment and tells the server
// through its webhook; nothing on this page changes the plan by itself.
export function CheckoutButton({ settings, priceId, label, primary }: { settings: CheckoutSettings; priceId: string; label: string; primary?: boolean }) {
  const t = useTranslations("billing");
  const locale = useLocale();
  const [paddle, setPaddle] = useState<Paddle>();

  useEffect(() => {
    initializePaddle({ token: settings.token, environment: settings.environment }).then(setPaddle, () => setPaddle(undefined));
  }, [settings.token, settings.environment]);

  return (
    <Button
      variant={primary ? "default" : "outline"}
      disabled={!paddle}
      onClick={() => {
        if (!paddle) {
          toast({ title: t("errors.unavailable"), variant: "destructive" });
          return;
        }
        paddle.Checkout.open({
          items: [{ priceId, quantity: 1 }],
          customer: { email: settings.email },
          customData: { organizationId: settings.organizationId },
          settings: { displayMode: "overlay", locale, successUrl: settings.successUrl },
        });
      }}
    >
      {label}
    </Button>
  );
}

export function PortalButton() {
  const t = useTranslations("billing");
  const portal = useMutation({
    mutationFn: openCustomerPortal,
    onSuccess: (result) => {
      if ("url" in result) {
        window.location.assign(result.url);
      } else {
        toast({ title: t(`errors.${result.error}`), variant: "destructive" });
      }
    },
    onError: () => toast({ title: t("errors.unavailable"), variant: "destructive" }),
  });

  return (
    <Button variant="outline" disabled={portal.isPending} onClick={() => portal.mutate()}>
      {t("manage")}
    </Button>
  );
}

// Switches an existing subscription to another plan, after a confirmation.
export function ChangePlanButton({ plan, planName, label }: { plan: string; planName: string; label: string }) {
  const t = useTranslations("billing");
  const common = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const change = useMutation({
    mutationFn: () => changePlan(plan),
    onSuccess: (result) => {
      if ("error" in result) {
        toast({ title: t(`errors.${result.error}`), variant: "destructive" });
        return;
      }
      toast({ title: t("changeRequested", { plan: planName }) });
      setOpen(false);
      router.refresh();
    },
    onError: () => toast({ title: t("errors.unavailable"), variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">{label}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("changeTitle", { plan: planName })}</DialogTitle>
          <DialogDescription>{t("changeText")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {common("cancel")}
          </Button>
          <Button disabled={change.isPending} onClick={() => change.mutate()}>
            {t("changeConfirm", { plan: planName })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
