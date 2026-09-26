import { MarketingIntro, MarketingPage } from "@/components/landing/marketing-page";
import { Eyebrow } from "@/components/ui/eyebrow";
import { PUBLIC_INSTRUMENTS } from "@/utils/public-instruments";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export async function generateMetadata() {
  const t = await getTranslations("instruments");
  return { title: t("metaTitle"), description: t("metaDescription"), alternates: { canonical: "/instruments" } };
}

export default async function InstrumentsPage() {
  const t = await getTranslations("instruments");
  const kinds = ["ability", "personality"] as const;

  return (
    <MarketingPage>
      <MarketingIntro eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-4">
        {kinds.map((kind) => (
          <section key={kind} className="border-t border-foreground/80 pt-4">
            <h2 className="text-2xl font-medium">{t(`kinds.${kind}`)}</h2>
            <ul className="mt-4">
              {PUBLIC_INSTRUMENTS.filter((instrument) => instrument.kind === kind).map((instrument) => (
                <li key={instrument.slug} className="border-b">
                  <Link
                    href={`/instruments/${instrument.slug}`}
                    className="group grid gap-x-8 gap-y-1 py-5 md:grid-cols-[1fr_2fr_auto] md:items-baseline"
                  >
                    <span className="font-heading text-xl font-medium group-hover:text-primary">{t(`items.${instrument.slug}.name`)}</span>
                    <span className="text-sm text-muted-foreground">{t(`items.${instrument.slug}.summary`)}</span>
                    <Eyebrow className="whitespace-nowrap">
                      {t("questions", { count: instrument.questions })} · {t("minutes", { count: instrument.minutes })}
                    </Eyebrow>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
        <p className="max-w-2xl text-sm text-muted-foreground">{t("clinicalNote")}</p>
      </div>
    </MarketingPage>
  );
}
