"use client";

import { dismissSetup, dismissWelcome } from "@/actions/onboarding/onboarding-actions";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

const ACTIONS = { setup: dismissSetup, welcome: dismissWelcome };

// Closes an onboarding card for good.
export function DismissButton({ what, label }: { what: keyof typeof ACTIONS; label: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="-mr-2 -mt-2 shrink-0"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await ACTIONS[what]();
          router.refresh();
        })
      }
    >
      <X className="h-4 w-4" />
      <span className="sr-only">{label}</span>
    </Button>
  );
}
