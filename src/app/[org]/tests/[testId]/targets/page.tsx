import { findTestById } from "@/actions/test/find-test-by-id-action";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { ensureMember } from "@/utils/authentication";
import type { TestScale } from "@/utils/constants";
import { loadTargetProfiles } from "@/utils/hiring";
import { organizationBase } from "@/utils/organization-path";
import { targetKind } from "@/utils/target-profiles";
import { validityScaleIds } from "@/utils/validity";
import { Target } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { DeleteTargetProfileButton, TargetProfileDialog } from "./target-editor";

type PathParams = { params: Promise<{ testId: string }> };

// The target profiles of one test: named ranges per scale that candidates' results are read against.
export default async function TargetProfilesPage(props: PathParams) {
  const params = await props.params;
  const { organization } = await ensureMember("manageRounds");
  const base = await organizationBase();
  const t = await getTranslations("hiring.targets");
  const results = await getTranslations("results");
  const format = await getFormatter();
  const test = await findTestById(params.testId);

  // Clinical and wellbeing screens never go to hiring.
  if (!test || test.sensitive) {
    notFound();
  }

  const kind = targetKind(test.strategy);
  const allScales = JSON.parse(test.scales) as TestScale[];
  const validity = validityScaleIds(allScales);
  const scales = allScales.filter((scale) => !validity.has(scale.id)).map((scale) => ({ id: scale.id, name: scale.name }));
  const nameOf = new Map(scales.map((scale) => [scale.id, scale.name]));
  const profiles = kind ? await loadTargetProfiles(organization.id, test.id) : [];

  return (
    <>
      <PageHeader
        title={t("title")}
        crumb={t("title")}
        eyebrow={test.name}
        description={t("description")}
        back={{ href: `${base}/tests/${test.id}/results`, label: results("title") }}
        actions={kind && <TargetProfileDialog testId={test.id} scales={scales} kind={kind} />}
      />
      {!kind ? (
        <EmptyState icon={Target} title={t("noNormsTitle")} description={t("noNorms")} />
      ) : profiles.length === 0 ? (
        <EmptyState icon={Target} title={t("empty")} description={t("emptyText")} />
      ) : (
        <Card className="p-2 sm:p-4">
          <ul className="divide-y">
            {profiles.map((profile) => (
              <li key={profile.id} className="flex flex-col gap-2 px-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="font-medium">{profile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {profile.bands
                      .flatMap((band) => (nameOf.has(band.scaleId) ? [t("band", { scale: nameOf.get(band.scaleId)!, from: band.min, to: band.max })] : []))
                      .join(" · ")}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">{t("changed", { date: format.dateTime(profile.updatedAt, { dateStyle: "medium" }) })}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <TargetProfileDialog testId={test.id} scales={scales} kind={kind} profile={profile} />
                  <DeleteTargetProfileButton id={profile.id} name={profile.name} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
