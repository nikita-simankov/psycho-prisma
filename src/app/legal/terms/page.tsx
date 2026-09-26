import { LegalDocument, legalMetadata } from "@/components/landing/legal-document";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  return legalMetadata("terms", "/legal/terms");
}

export default async function TermsPage() {
  const t = await getTranslations("legal.common");
  return <LegalDocument doc="terms" eyebrow={t("eyebrow")} />;
}
