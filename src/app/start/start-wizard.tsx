"use client";

import { inviteColleagues, openSampleWorkspace, saveStartAnswers, type ColleagueOutcome } from "@/actions/onboarding/onboarding-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/utils/utils";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Compass, FlaskConical, LayoutDashboard } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const GOALS = ["development", "hiring", "wellbeing"] as const;
const TEAM_SIZES = ["1-50", "51-200", "201-1000", "1000+"] as const;
type Goal = (typeof GOALS)[number];

export type Suggestion = { id: string; name: string; sensitive: boolean; minutes: number | null };

type Properties = {
  organization: { slug: string; name: string };
  firstName: string;
  verified: boolean;
  initialGoal: Goal;
  initialTeamSize: string;
  suggestions: Record<Goal, Suggestion[]>;
  roles: string[];
};

function Steps({ current }: { current: number }) {
  const t = useTranslations("start.steps");
  return (
    <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm" aria-label={t("label")}>
      {(["goal", "invite", "try"] as const).map((key, index) => (
        <li key={key} className="flex items-center gap-2" aria-current={index === current ? "step" : undefined}>
          {index > 0 && <span className="h-px w-4 bg-border" aria-hidden />}
          <span
            className={cn(
              "flex size-5 items-center justify-center rounded-full border font-mono text-[0.6875rem]",
              index < current && "border-foreground bg-foreground text-background",
              index === current && "border-primary text-primary"
            )}
          >
            {index + 1}
          </span>
          <span className={cn(index === current ? "font-medium" : "text-muted-foreground")}>{t(key)}</span>
        </li>
      ))}
    </ol>
  );
}

export function StartWizard({ organization, firstName, verified, initialGoal, initialTeamSize, suggestions, roles }: Properties) {
  const t = useTranslations("start");
  const roleNames = useTranslations("roles");
  const common = useTranslations("common");
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<Goal>(initialGoal);
  const [teamSize, setTeamSize] = useState(initialTeamSize);
  const [rows, setRows] = useState(() => [0, 1, 2].map(() => ({ email: "", role: roles.includes("psychologist") ? "psychologist" : roles[0] ?? "admin" })));
  const [outcomes, setOutcomes] = useState<ColleagueOutcome[] | null>(null);
  const onError = () => toast({ title: common("error"), variant: "destructive" });

  const saveGoal = useMutation({ mutationFn: () => saveStartAnswers({ goal, teamSize }), onSuccess: () => setStep(1), onError });
  const invite = useMutation({ mutationFn: () => inviteColleagues(rows), onSuccess: setOutcomes, onError });
  const sample = useMutation({
    mutationFn: openSampleWorkspace,
    onSuccess: ({ slug }) => {
      router.push(`/${slug}`);
      router.refresh();
    },
    onError,
  });
  const first = suggestions[goal][0];

  return (
    <>
      <div className="flex flex-col gap-4">
        <Steps current={step} />
        <h1 className="text-4xl font-medium leading-[1.1]">
          {step === 0 ? (firstName ? t("goal.titleNamed", { name: firstName }) : t("goal.title")) : step === 1 ? t("invite.title") : t("try.title")}
        </h1>
        <p className="text-lg text-muted-foreground">
          {step === 0 ? t("goal.text", { organization: organization.name }) : step === 1 ? t("invite.text") : t("try.text")}
        </p>
      </div>

      {step === 0 && (
        <form
          className="flex flex-col gap-8"
          onSubmit={(event) => {
            event.preventDefault();
            saveGoal.mutate();
          }}
        >
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-3 text-sm font-medium">{t("goal.question")}</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {GOALS.map((option) => (
                <label
                  key={option}
                  className={cn(
                    "flex cursor-pointer flex-col gap-1 rounded-lg border bg-card p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                    goal === option ? "border-primary bg-accent" : "hover:bg-muted"
                  )}
                >
                  <input type="radio" name="goal" value={option} checked={goal === option} onChange={() => setGoal(option)} className="sr-only" />
                  <span className="font-medium">{t(`goal.options.${option}.label`)}</span>
                  <span className="text-sm text-muted-foreground">{t(`goal.options.${option}.text`)}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex flex-col gap-2">
            <Label htmlFor="team-size">{t("goal.teamSize")}</Label>
            <Select value={teamSize} onValueChange={setTeamSize}>
              <SelectTrigger id="team-size" className="sm:w-60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEAM_SIZES.map((size) => (
                  <SelectItem key={size} value={size}>
                    {t("goal.people", { size })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <section className="flex flex-col gap-3" aria-labelledby="suggested">
            <Eyebrow id="suggested">{t("goal.suggested")}</Eyebrow>
            <ul className="flex flex-col divide-y rounded-lg border bg-card">
              {suggestions[goal].map((test) => (
                <li key={test.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span className="flex items-center gap-2">
                    {test.name}
                    {test.sensitive && <Badge variant="outline">{t("goal.clinical")}</Badge>}
                  </span>
                  {test.minutes && <span className="shrink-0 font-mono text-xs text-muted-foreground">{t("minutes", { count: test.minutes })}</span>}
                </li>
              ))}
            </ul>
          </section>
          <Button type="submit" size="lg" className="self-start" disabled={saveGoal.isPending}>
            {t("continue")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
      )}

      {step === 1 && (
        <form
          className="flex flex-col gap-6"
          onSubmit={(event) => {
            event.preventDefault();
            if (outcomes) setStep(2);
            else invite.mutate();
          }}
        >
          {!verified && <p className="rounded-lg border bg-accent/50 p-3 text-sm">{t("invite.held")}</p>}
          {outcomes ? (
            <ul className="flex flex-col divide-y rounded-lg border bg-card" aria-live="polite">
              {outcomes.length === 0 && <li className="px-4 py-3 text-sm text-muted-foreground">{t("invite.nobody")}</li>}
              {outcomes.map((outcome) => (
                <li key={outcome.email} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span className="truncate">{outcome.email}</span>
                  <span className="shrink-0 text-muted-foreground">{t(`invite.outcomes.${outcome.outcome}`)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col gap-3">
              {rows.map((row, index) => (
                <div key={index} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_12rem]">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`colleague-${index}`} className={cn(index > 0 && "sr-only")}>
                      {t("invite.email")}
                    </Label>
                    <Input
                      id={`colleague-${index}`}
                      type="email"
                      placeholder={t("invite.placeholder")}
                      value={row.email}
                      onChange={(event) => setRows(rows.map((r, i) => (i === index ? { ...r, email: event.target.value } : r)))}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`colleague-role-${index}`} className={cn(index > 0 && "sr-only")}>
                      {t("invite.role")}
                    </Label>
                    <Select value={row.role} onValueChange={(role) => setRows(rows.map((r, i) => (i === index ? { ...r, role } : r)))}>
                      <SelectTrigger id={`colleague-role-${index}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {roleNames(role)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
              <p className="text-sm text-muted-foreground">{t("invite.hint")}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" size="lg" disabled={invite.isPending}>
              {outcomes ? t("continue") : t("invite.send")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            {!outcomes && (
              <Button type="button" size="lg" variant="ghost" onClick={() => setStep(2)}>
                {t("invite.later")}
              </Button>
            )}
          </div>
        </form>
      )}

      {step === 2 && (
        <div className="grid gap-3">
          {first && (
            <Link href={`/tests/${first.id}`} className="group flex items-start gap-4 rounded-lg border bg-card p-5 transition-colors hover:bg-muted">
              <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <span className="flex flex-col gap-1">
                <span className="font-medium">{t("try.yourself")}</span>
                <span className="text-sm text-muted-foreground">
                  {first.minutes ? t("try.yourselfTextMinutes", { test: first.name, count: first.minutes }) : t("try.yourselfText", { test: first.name })}
                </span>
              </span>
            </Link>
          )}
          <button
            type="button"
            onClick={() => sample.mutate()}
            disabled={sample.isPending}
            className="flex items-start gap-4 rounded-lg border bg-card p-5 text-left transition-colors hover:bg-muted disabled:opacity-60"
          >
            <Compass className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
            <span className="flex flex-col gap-1">
              <span className="font-medium">{sample.isPending ? t("try.sampleLoading") : t("try.sample")}</span>
              <span className="text-sm text-muted-foreground">{t("try.sampleText")}</span>
            </span>
          </button>
          <Link href={`/${organization.slug}`} className="flex items-start gap-4 rounded-lg border bg-card p-5 transition-colors hover:bg-muted">
            <LayoutDashboard className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
            <span className="flex flex-col gap-1">
              <span className="font-medium">{t("try.workspace")}</span>
              <span className="text-sm text-muted-foreground">{t("try.workspaceText", { organization: organization.name })}</span>
            </span>
          </Link>
        </div>
      )}
    </>
  );
}
