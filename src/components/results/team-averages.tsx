import type { GroupAverage } from "@/utils/results";
import { MIN_GROUP } from "@/utils/results";
import { Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { ScaleProfile } from "./scale-profile";

// Averages for the organization and each team large enough to keep people anonymous.
export function TeamAverages({ groups }: { groups: GroupAverage[] }) {
  const t = useTranslations("averages");

  return (
    <div className="flex flex-col gap-4">
      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <Users className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        {t("note", { min: MIN_GROUP })}
      </p>
      {groups.length === 0 && <p className="border-t border-foreground/80 pt-4 text-muted-foreground">{t("tooFew", { min: MIN_GROUP })}</p>}
      {groups.map((group) => (
        <section key={group.key} className="flex flex-col gap-3 border-t border-foreground/80 pt-4">
          <header>
            <h2 className="text-xl font-medium">{group.teamName ?? t("everyone")}</h2>
            <p className="font-mono text-xs text-muted-foreground">{t("people", { count: group.people })}</p>
          </header>
          <ScaleProfile
            rows={group.scales.map((scale) => ({
              scaleId: scale.scaleId,
              scaleName: scale.scaleName,
              rawGrade: scale.kind === "raw" ? scale.average : null,
              correctedGrade: null,
              tGrade: scale.kind === "t" ? scale.average : null,
              stan: scale.kind === "sten" ? scale.average : null,
              summary: null,
            }))}
          />
        </section>
      ))}
    </div>
  );
}
