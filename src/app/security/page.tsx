import { LegalDocument, legalMetadata } from "@/components/landing/legal-document";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  return legalMetadata("security", "/security");
}

export default async function SecurityPage() {
  const t = await getTranslations("legal.security");
  return <LegalDocument doc="security" eyebrow={t("eyebrow")} showIndexLink={false} />;
}
