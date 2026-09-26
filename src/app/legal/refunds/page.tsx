import { LegalDocument, legalMetadata } from "@/components/landing/legal-document";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  return legalMetadata("refunds", "/legal/refunds");
}

export default async function RefundsPage() {
  const t = await getTranslations("legal.common");
  return <LegalDocument doc="refunds" eyebrow={t("eyebrow")} />;
}
