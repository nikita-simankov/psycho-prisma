import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

// Opens the round composer prefilled with a test, questionnaire, person or team.
export async function SendInRound({ href, variant = "outline" }: { href: string; variant?: "outline" | "default" }) {
  const t = await getTranslations("rounds");
  return (
    <Button variant={variant} asChild>
      <Link href={href}>
        <Send className="h-4 w-4" aria-hidden />
        {t("sendInRound")}
      </Link>
    </Button>
  );
}
