import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { hasFeature, type FeatureKey } from "@/utils/billing-rules";
import { organizationBase } from "@/utils/organization-path";
import { PLANS } from "@/utils/plans";
import { cn } from "@/utils/utils";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

// Shown in place of a feature the organization's plan doesn't include, naming the plan that does.
export async function UpgradeNotice({ feature, className }: { feature: FeatureKey; className?: string }) {
  const t = await getTranslations("billing.upgrade");
  const pricing = await getTranslations("pricing");
  const base = await organizationBase();
  const plan = PLANS.find((entry) => hasFeature(entry.id, feature)) ?? PLANS[PLANS.length - 1];

  return (
    <div className={cn("flex flex-col items-start gap-3 border-l-2 border-primary bg-accent/50 px-5 py-4", className)}>
      <Eyebrow className="text-accent-foreground">{t("eyebrow", { plan: pricing(`plans.${plan.id}.name`) })}</Eyebrow>
      <p className="font-heading text-lg">{pricing(`features.${feature}`)}</p>
      <p className="max-w-xl text-sm text-muted-foreground">{t("text", { plan: pricing(`plans.${plan.id}.name`) })}</p>
      <Button asChild size="sm">
        <Link href={`${base}/settings/billing`}>{t("button")}</Link>
      </Button>
    </div>
  );
}
