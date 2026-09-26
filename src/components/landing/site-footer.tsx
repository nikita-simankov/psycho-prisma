import { Eyebrow } from "@/components/ui/eyebrow";
import { LogoMark } from "@/components/ui/logo";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export async function SiteFooter() {
  const t = await getTranslations("site");

  const columns = [
    {
      title: t("footer.productTitle"),
      links: [
        { href: "/product", label: t("nav.product") },
        { href: "/instruments", label: t("nav.instruments") },
        { href: "/pricing", label: t("nav.pricing") },
      ],
    },
    {
      title: t("footer.companyTitle"),
      links: [
        { href: "/security", label: t("nav.security") },
        { href: "/legal", label: t("footer.legal") },
        { href: "/privacy", label: t("footer.privacy") },
      ],
    },
  ];

  return (
    <footer className="border-t border-foreground/80">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[2fr_1fr_1fr]">
        <div className="flex max-w-sm flex-col gap-4">
          <LogoMark className="size-7" />
          <p className="font-heading text-lg">{t("footer.tagline")}</p>
          <p className="text-sm text-muted-foreground">{t("footer.disclaimer")}</p>
        </div>
        {columns.map((column) => (
          <div key={column.title} className="flex flex-col gap-3">
            <Eyebrow>{column.title}</Eyebrow>
            <ul className="flex flex-col gap-2 text-sm">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto max-w-6xl px-4 pb-8 text-xs text-muted-foreground">
        {t("footer.copyright", { year: new Date().getFullYear() })}
      </div>
    </footer>
  );
}
