import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

// Static illustration of a scored result, so the hero shows what the product does.
export function ResultPreview() {
  const t = useTranslations("landing.preview");
  const scales = [
    { label: t("scaleA"), value: 38, width: "48%" },
    { label: t("scaleB"), value: 44, width: "62%" },
  ];
  const initials = t("person")
    .split(" ")
    .map((part) => part[0])
    .join("");

  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden="true">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/20 via-transparent to-success/20 blur-2xl" />
      <div className="rounded-2xl border bg-card p-5 shadow-xl shadow-primary/5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">{t("person")}</p>
            <p className="truncate text-sm text-muted-foreground">{t("role")}</p>
          </div>
        </div>
        <div className="mt-5 rounded-xl border bg-background p-4">
          <p className="font-heading text-sm font-semibold">{t("test")}</p>
          <div className="mt-4 flex flex-col gap-3">
            {scales.map((scale) => (
              <div key={scale.label} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{scale.label}</span>
                  <span className="font-semibold tabular-nums text-foreground">{scale.value}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: scale.width }} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 border-l-2 border-primary/40 pl-3 text-sm text-muted-foreground">{t("summary")}</p>
        </div>
      </div>
      <div className="absolute -bottom-4 left-4 flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium shadow-lg">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        {t("badge")}
      </div>
    </div>
  );
}
