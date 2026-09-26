import { LegalDocument, legalMetadata, WithPlaceholders } from "@/components/landing/legal-document";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  return legalMetadata("subprocessors", "/legal/subprocessors");
}

type Row = { name: string; purpose: string; data: string; location: string };

export default async function SubprocessorsPage() {
  const common = await getTranslations("legal.common");
  const t = await getTranslations("legal.subprocessors.table");
  const rows = Object.entries(t.raw("rows") as Record<string, Row>);

  const table = (
    <div className="-mx-4 overflow-x-auto px-4">
      <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
        <caption className="sr-only">{t("caption")}</caption>
        <thead>
          <tr className="border-b border-foreground/80">
            {(["name", "purpose", "data", "location"] as const).map((column) => (
              <th key={column} scope="col" className="py-2 pr-4 align-bottom font-medium">
                {t(`headers.${column}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([key, row]) => (
            <tr key={key} className="border-b border-border align-top">
              <th scope="row" className="py-3 pr-4 font-medium">
                <WithPlaceholders text={row.name} />
              </th>
              <td className="py-3 pr-4">
                <WithPlaceholders text={row.purpose} />
              </td>
              <td className="py-3 pr-4 text-muted-foreground">
                <WithPlaceholders text={row.data} />
              </td>
              <td className="py-3 pr-4">
                <WithPlaceholders text={row.location} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return <LegalDocument doc="subprocessors" eyebrow={common("eyebrow")} slots={{ list: table }} />;
}
