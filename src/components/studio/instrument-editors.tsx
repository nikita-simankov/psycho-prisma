"use client";

import { updateTestSettings } from "@/actions/studio/studio-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { validateFormContent, validateTestContent, type FormContent, type Issue, type TestContent } from "@/utils/instrument-content";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { QuestionList } from "./question-list";
import { InterpretationsEditor, NormsEditor, ScoringEditor } from "./scoring-editor";
import { IssueList, StudioToolbar } from "./studio-toolbar";
import { useInstrumentDraft } from "./use-instrument-draft";

type Common = { id: string; version: number; hasDraft: boolean; backHref: string };

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Details<C extends { name: string; description: string; ttc: number }>({
  content,
  update,
  children,
}: {
  content: C;
  update: (next: (current: C) => C) => void;
  children?: React.ReactNode;
}) {
  const t = useTranslations("studio.details");
  return (
    <div className="grid max-w-2xl gap-4">
      <Field id="name" label={t("name")}>
        <Input id="name" value={content.name} onChange={(event) => update((current) => ({ ...current, name: event.target.value }))} />
      </Field>
      <Field id="description" label={t("description")}>
        <Textarea id="description" rows={3} value={content.description} onChange={(event) => update((current) => ({ ...current, description: event.target.value }))} />
      </Field>
      {children}
      <Field id="ttc" label={t("minutes")}>
        <Input
          id="ttc"
          type="number"
          min={0}
          className="w-32"
          value={content.ttc}
          onChange={(event) => update((current) => ({ ...current, ttc: Math.max(0, Math.round(Number(event.target.value) || 0)) }))}
        />
      </Field>
    </div>
  );
}

// Which tab each problem is fixed on, so the tab can show a count.
function issuesByTab(issues: Issue[]) {
  const tab: Record<Issue["code"], string> = {
    name: "details",
    noQuestions: "questions",
    questionText: "questions",
    fewChoices: "questions",
    choiceText: "questions",
    noScales: "scoring",
    scaleName: "scoring",
    noKeys: "scoring",
    unknownKey: "scoring",
    formula: "scoring",
    noNorms: "norms",
    normRange: "norms",
    normOverlap: "norms",
    noTTable: "norms",
    summaryRange: "interpretations",
    unknownScale: "interpretations",
  };
  return issues.reduce<Record<string, number>>((counts, issue) => ({ ...counts, [tab[issue.code]]: (counts[tab[issue.code]] ?? 0) + 1 }), {});
}

function TabLabel({ label, count }: { label: string; count?: number }) {
  return (
    <span className="flex items-center gap-1.5">
      {label}
      {count ? (
        <span className="rounded-full bg-destructive/15 px-1.5 text-xs tabular-nums text-destructive" aria-label={String(count)}>
          {count}
        </span>
      ) : null}
    </span>
  );
}

export function TestEditor({
  initial,
  settings,
  canMarkSensitive,
  ...common
}: Common & { initial: TestContent; settings: { sensitive: boolean; retestDays: number }; canMarkSensitive: boolean }) {
  const t = useTranslations("studio");
  const draft = useInstrumentDraft("test", common.id, initial, common.hasDraft);
  const { content, update } = draft;
  const issues = useMemo(() => validateTestContent(content), [content]);
  const counts = issuesByTab(issues);
  const [testSettings, setTestSettings] = useState(settings);

  const saveSettings = (next: Partial<typeof settings>) => {
    const previous = testSettings;
    setTestSettings({ ...testSettings, ...next });
    updateTestSettings(common.id, next).catch(() => {
      setTestSettings(previous);
      toast({ title: t("settingsError"), variant: "destructive" });
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <StudioToolbar kind="test" {...common} status={draft.status} hasDraft={draft.hasDraft} issues={issues} flush={draft.flush} />
      <IssueList issues={issues} />
      <Tabs defaultValue="details">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList>
            {(["details", "questions", "scoring", "norms", "interpretations"] as const).map((tab) => (
              <TabsTrigger key={tab} value={tab}>
                <TabLabel label={t(`tabs.${tab}`)} count={counts[tab]} />
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <TabsContent value="details" className="pt-2">
          <Details content={content} update={update}>
            <Field id="instruction" label={t("details.instruction")}>
              <Textarea id="instruction" rows={4} value={content.instruction} onChange={(event) => update((current) => ({ ...current, instruction: event.target.value }))} />
            </Field>
          </Details>
          <section className="mt-8 grid max-w-2xl gap-4 border-t pt-6">
            <div>
              <h2 className="font-semibold">{t("settings.title")}</h2>
              <p className="text-sm text-muted-foreground">{t("settings.hint")}</p>
            </div>
            <Field id="retest" label={t("settings.retestDays")} hint={t("settings.retestHint")}>
              <Input
                id="retest"
                type="number"
                min={0}
                className="w-32"
                defaultValue={testSettings.retestDays}
                onBlur={(event) => {
                  const days = Math.max(0, Math.min(3650, Math.round(Number(event.target.value) || 0)));
                  if (days !== testSettings.retestDays) saveSettings({ retestDays: days });
                }}
              />
            </Field>
            {canMarkSensitive && (
              <label className="flex items-start gap-3 text-sm">
                <Switch checked={testSettings.sensitive} onCheckedChange={(sensitive) => saveSettings({ sensitive })} />
                <span>
                  <span className="font-medium">{t("settings.sensitive")}</span>
                  <span className="block text-muted-foreground">{t("settings.sensitiveHint")}</span>
                </span>
              </label>
            )}
          </section>
        </TabsContent>
        <TabsContent value="questions" className="pt-2">
          <QuestionList questions={content.questions} onChange={(questions) => update((current) => ({ ...current, questions }))} />
        </TabsContent>
        <TabsContent value="scoring" className="pt-2">
          <ScoringEditor content={content} onChange={(next) => update(() => next)} />
        </TabsContent>
        <TabsContent value="norms" className="pt-2">
          <NormsEditor content={content} onChange={(next) => update(() => next)} />
        </TabsContent>
        <TabsContent value="interpretations" className="pt-2">
          <InterpretationsEditor content={content} onChange={(next) => update(() => next)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function FormEditor({ initial, ...common }: Common & { initial: FormContent }) {
  const t = useTranslations("studio");
  const draft = useInstrumentDraft("form", common.id, initial, common.hasDraft);
  const { content, update } = draft;
  const issues = useMemo(() => validateFormContent(content), [content]);
  const counts = issuesByTab(issues);

  return (
    <div className="flex flex-col gap-4">
      <StudioToolbar kind="form" {...common} status={draft.status} hasDraft={draft.hasDraft} issues={issues} flush={draft.flush} />
      <IssueList issues={issues} />
      <Tabs defaultValue="details">
        <TabsList>
          {(["details", "questions"] as const).map((tab) => (
            <TabsTrigger key={tab} value={tab}>
              <TabLabel label={t(`tabs.${tab}`)} count={counts[tab]} />
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="details" className="pt-2">
          <Details content={content} update={update}>
            <label className="flex items-start gap-3 text-sm">
              <Switch checked={content.adminOnly} onCheckedChange={(adminOnly) => update((current) => ({ ...current, adminOnly }))} />
              <span>
                <span className="font-medium">{t("details.adminOnly")}</span>
                <span className="block text-muted-foreground">{t("details.adminOnlyHint")}</span>
              </span>
            </label>
          </Details>
        </TabsContent>
        <TabsContent value="questions" className="pt-2">
          <QuestionList withTypes questions={content.questions} onChange={(questions) => update((current) => ({ ...current, questions }))} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
