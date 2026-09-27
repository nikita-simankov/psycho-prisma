"use client";

import { deleteTargetProfile, saveTargetProfile } from "@/actions/hiring/target-profile-actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import type { NormScale } from "@/utils/norms";
import { TARGET_LIMITS, type TargetBand } from "@/utils/target-profiles";
import { useMutation } from "@tanstack/react-query";
import { ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Scale = { id: number; name: string };
type Row = { on: boolean; min: string; max: string; low: string; high: string };

function initialRows(scales: Scale[], kind: NormScale, bands: TargetBand[]): Record<number, Row> {
  const limits = TARGET_LIMITS[kind];
  // A new range starts at the average band.
  const start = kind === "sten" ? { min: 4, max: 7 } : { min: 40, max: 60 };
  return Object.fromEntries(
    scales.map((scale) => {
      const band = bands.find((entry) => entry.scaleId === scale.id);
      return [
        scale.id,
        {
          on: Boolean(band),
          min: String(band?.min ?? Math.max(limits.min, start.min)),
          max: String(band?.max ?? Math.min(limits.max, start.max)),
          low: band?.low ?? "",
          high: band?.high ?? "",
        },
      ];
    })
  );
}

// Creates or edits one target profile: a name, then a range for each scale the role cares about,
// with optional interview questions for scores below or above it.
export function TargetProfileDialog({
  testId,
  scales,
  kind,
  profile,
}: {
  testId: string;
  scales: Scale[];
  kind: NormScale;
  profile?: { id: string; name: string; bands: TargetBand[] };
}) {
  const t = useTranslations("hiring.targets");
  const common = useTranslations("common");
  const router = useRouter();
  const limits = TARGET_LIMITS[kind];
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(profile?.name ?? "");
  const [rows, setRows] = useState(() => initialRows(scales, kind, profile?.bands ?? []));
  const chosen = scales.filter((scale) => rows[scale.id].on);
  const update = (id: number, change: Partial<Row>) => setRows((current) => ({ ...current, [id]: { ...current[id], ...change } }));

  const save = useMutation({
    mutationFn: async () => {
      const result = await saveTargetProfile({
        id: profile?.id ?? null,
        testId,
        name,
        bands: chosen.map((scale) => {
          const row = rows[scale.id];
          return { scaleId: scale.id, min: Number(row.min), max: Number(row.max), low: row.low, high: row.high };
        }),
      });
      if ("error" in result) throw new Error(t(`errors.${result.error}`));
      return result;
    },
    onSuccess: () => {
      toast({ title: t("saved") });
      setOpen(false);
      router.refresh();
    },
    onError: (error) => toast({ title: error instanceof Error && error.message ? error.message : common("error"), variant: "destructive" }),
  });
  const invalid = chosen.some((scale) => {
    const min = Number(rows[scale.id].min);
    const max = Number(rows[scale.id].max);
    return !Number.isInteger(min) || !Number.isInteger(max) || min > max || min < limits.min || max > limits.max;
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        // Reopening starts from what is saved, not from abandoned edits.
        if (next) {
          setName(profile?.name ?? "");
          setRows(initialRows(scales, kind, profile?.bands ?? []));
        }
      }}
    >
      <DialogTrigger asChild>
        {profile ? (
          <Button variant="ghost" size="sm" aria-label={t("editLabel", { name: profile.name })}>
            <Pencil className="h-4 w-4" />
            {common("edit")}
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4" />
            {t("new")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{profile ? t("editTitle", { name: profile.name }) : t("createTitle")}</DialogTitle>
          <DialogDescription>{t(`kind.${kind}`)}</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate();
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="target-name">{t("name")}</Label>
            <Input id="target-name" value={name} maxLength={100} placeholder={t("namePlaceholder")} onChange={(event) => setName(event.target.value)} />
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">{t("scales")}</legend>
            <ul className="divide-y rounded-lg border">
              {scales.map((scale) => {
                const row = rows[scale.id];
                return (
                  <li key={scale.id} className="flex flex-col gap-3 p-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-sm">
                        <Checkbox checked={row.on} onCheckedChange={(checked) => update(scale.id, { on: checked === true })} aria-label={t("targetScale", { scale: scale.name })} />
                        {scale.name}
                      </label>
                      {row.on && (
                        <span className="flex items-center gap-2 text-sm">
                          <Input
                            type="number"
                            inputMode="numeric"
                            min={limits.min}
                            max={limits.max}
                            className="w-20"
                            aria-label={t("from", { scale: scale.name })}
                            value={row.min}
                            onChange={(event) => update(scale.id, { min: event.target.value })}
                          />
                          <span aria-hidden>–</span>
                          <Input
                            type="number"
                            inputMode="numeric"
                            min={limits.min}
                            max={limits.max}
                            className="w-20"
                            aria-label={t("to", { scale: scale.name })}
                            value={row.max}
                            onChange={(event) => update(scale.id, { max: event.target.value })}
                          />
                        </span>
                      )}
                    </div>
                    {row.on && (
                      <details className="group">
                        <summary className="flex cursor-pointer list-none items-center gap-1 text-sm text-primary">
                          <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" aria-hidden />
                          {t("questions")}
                        </summary>
                        <div className="mt-2 grid gap-3 sm:grid-cols-2">
                          <div className="flex flex-col gap-1.5">
                            <Label htmlFor={`low-${scale.id}`}>{t("lowQuestions")}</Label>
                            <Textarea id={`low-${scale.id}`} rows={3} maxLength={1000} value={row.low} onChange={(event) => update(scale.id, { low: event.target.value })} />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label htmlFor={`high-${scale.id}`}>{t("highQuestions")}</Label>
                            <Textarea id={`high-${scale.id}`} rows={3} maxLength={1000} value={row.high} onChange={(event) => update(scale.id, { high: event.target.value })} />
                          </div>
                          <p className="text-xs text-muted-foreground sm:col-span-2">{t("questionsHint")}</p>
                        </div>
                      </details>
                    )}
                  </li>
                );
              })}
            </ul>
            {chosen.length === 0 && <p className="text-sm text-muted-foreground">{t("pickOne")}</p>}
            {invalid && <p className="text-sm text-destructive">{t("errors.invalidBand")}</p>}
          </fieldset>
          <DialogFooter>
            <Button type="submit" disabled={!name.trim() || chosen.length === 0 || invalid || save.isPending}>
              {t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteTargetProfileButton({ id, name }: { id: string; name: string }) {
  const t = useTranslations("hiring.targets");
  const common = useTranslations("common");
  const router = useRouter();
  const remove = useMutation({
    mutationFn: () => deleteTargetProfile(id),
    onSuccess: () => router.refresh(),
    onError: () => toast({ title: common("error"), variant: "destructive" }),
  });

  return (
    <Button variant="ghost" size="sm" disabled={remove.isPending} aria-label={t("deleteLabel", { name })} onClick={() => remove.mutate()}>
      <Trash2 className="h-4 w-4" />
      {t("delete")}
    </Button>
  );
}
