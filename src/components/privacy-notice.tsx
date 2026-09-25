import { Eye, FileText, Hourglass, ShieldCheck, Target } from "lucide-react";
import { useTranslations } from "next-intl";

const SECTIONS = [
  { key: "collect", icon: FileText },
  { key: "purpose", icon: Target },
  { key: "access", icon: Eye },
  { key: "storage", icon: Hourglass },
  { key: "rights", icon: ShieldCheck },
] as const;

// The privacy notice shown on /privacy and on the consent screen. On the consent
// screen it names the organization responsible for the data and its contact.
export function PrivacyNotice({ organization, contact }: { organization?: string; contact?: string }) {
  const t = useTranslations("privacy");

  return (
    <div className="flex flex-col gap-5">
      {SECTIONS.map(({ key, icon: Icon }) => (
        <section key={key} className="flex gap-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Icon className="h-4 w-4" />
          </span>
          <div className="flex flex-col gap-1">
            <h2 className="font-heading font-semibold">{t(`sections.${key}.title`)}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{t(`sections.${key}.text`)}</p>
          </div>
        </section>
      ))}
      <div className="flex flex-col gap-1 border-t pt-4 text-sm text-muted-foreground">
        <p>{organization ? t("controllerNamed", { organization }) : t("controller")}</p>
        {contact && <p>{t("contact", { contact })}</p>}
      </div>
    </div>
  );
}
