import { LegalDocument, legalMetadata } from "@/components/landing/legal-document";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  return legalMetadata("dpa", "/legal/dpa");
}

export default async function DpaPage() {
  const t = await getTranslations("legal.common");
  return <LegalDocument doc="dpa" eyebrow={t("eyebrow")} />;
}
