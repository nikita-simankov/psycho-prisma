"use client";

import {
  createRound,
  previewRoundEmail,
  saveRoundDraft,
  sendTestRoundEmail,
  type CreateRoundResult,
} from "@/actions/round/round-actions";
import { useOrganizationBase } from "@/components/organization-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { EMPTY_ROUND, PURPOSES, REPEATS, type RoundDraftData } from "@/utils/round-draft";
import { TIME_BUDGET_WARNING } from "@/utils/round-health";
import { cn } from "@/utils/utils";
import { useMutation } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  FlaskConical,
  LayoutTemplate,
  Mail,
  NotepadText,
  Search,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const LIFECYCLE: readonly string[] = ["start30", "start90", "anniversary"];
const STEPS = ["what", "who", "when", "review"] as const;

type Instrument = {
  kind: "test" | "form";
  id: string;
  name: string;
  minutes: number;
  sensitive: boolean;
  retestDays: number;
};
type Person = { id: string; name: string; teamId: string | null; email: string };
type Team = { id: string; name: string };
type Invitee = { id: string; email: string; name: string; teamId: string | null };
type Candidate = { email: string; name: string; lastName: string };
export type Template = { key: string; purpose: (typeof PURPOSES)[number]; repeat: string; dueDays: number; items: string[] };

const key = (item: { kind: string; id: string }) => `${item.kind}:${item.id}`;

// "email, first name, last name" per line; commas, semicolons or tabs between fields.
function parseCandidates(text: string): { candidates: Candidate[]; invalid: number } {
  const candidates: Candidate[] = [];
  let invalid = 0;
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    const [email = "", name = "", lastName = ""] = line.split(/[,;\t]/).map((part) => part.trim());
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && name) {
      candidates.push({ email, name, lastName });
    } else {
      invalid += 1;
    }
  }
  return { candidates, invalid };
}

function inDays(days: number) {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}

function Section({ title, description, children }: { title: string; description?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">{children}</CardContent>
    </Card>
  );
}

// What the round asks of each person, with a warning past the budget.
function TimeBudget({ chosen, minutes, compact = false }: { chosen: Instrument[]; minutes: number; compact?: boolean }) {
  const t = useTranslations("rounds.form");
  if (!chosen.length) return null;
  const over = minutes > TIME_BUDGET_WARNING;

  return (
    <div className={cn("flex flex-col gap-1.5", compact ? "mt-2" : "rounded-lg border bg-card p-3")}>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium">{t("budget", { minutes })}</span>
        <span className="font-mono text-xs text-muted-foreground">{t("budgetLimit", { minutes: TIME_BUDGET_WARNING })}</span>
      </div>
      <div className="flex h-1.5 gap-px overflow-hidden rounded-full bg-muted" role="presentation">
        {chosen.map((item, index) => (
          <div
            key={key(item)}
            className={cn(over ? "bg-warning" : index % 2 ? "bg-primary/60" : "bg-primary")}
            style={{ width: `${(item.minutes / Math.max(minutes, TIME_BUDGET_WARNING)) * 100}%` }}
          />
        ))}
      </div>
      {over && (
        <p className="flex items-center gap-1.5 text-sm text-warning">
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          {t("budgetOver", { minutes: TIME_BUDGET_WARNING })}
        </p>
      )}
    </div>
  );
}

// A new round in four steps: what, who, when, and a review that shows the exact email. It is
// saved as a draft while it's composed, and can start from a template, a test, a person or a team.
export function RoundForm({
  instruments,
  people,
  teams,
  invitees = [],
  templates = [],
  canSendSensitive,
  initial,
  draftId: initialDraftId = null,
}: {
  instruments: Instrument[];
  people: Person[];
  teams: Team[];
  invitees?: Invitee[];
  templates?: Template[];
  canSendSensitive: boolean;
  initial?: Partial<RoundDraftData>;
  draftId?: string | null;
}) {
  const t = useTranslations("rounds.form");
  const rounds = useTranslations("rounds");
  const common = useTranslations("common");
  const router = useRouter();
  const base = useOrganizationBase();

  const [values, setValues] = useState<RoundDraftData>({ ...EMPTY_ROUND, ...initial });
  const [step, setStep] = useState(0);
  const [itemQuery, setItemQuery] = useState("");
  const [peopleQuery, setPeopleQuery] = useState("");
  const [result, setResult] = useState<Extract<CreateRoundResult, { roundId: string }> | null>(null);
  const [draftId, setDraftId] = useState<string | null>(initialDraftId);
  // The id the next save writes to, without saving again when it first arrives.
  const draftRef = useRef(initialDraftId);
  const [saved, setSaved] = useState(false);
  const set = <K extends keyof RoundDraftData>(field: K, value: RoundDraftData[K]) =>
    setValues((current) => ({ ...current, [field]: value }));

  const { name, purpose, items, teamIds, userIds, invitationIds, candidateText, dueDate, message, repeat } = values;
  const hiring = purpose === "hiring";
  const lifecycle = LIFECYCLE.includes(repeat);
  const { candidates, invalid } = parseCandidates(hiring ? candidateText : "");
  const teamMembers = people.filter((person) => person.teamId && teamIds.includes(person.teamId));
  const waiting = lifecycle
    ? 0
    : new Set([
        ...invitationIds,
        ...invitees.filter((invitee) => invitee.teamId && teamIds.includes(invitee.teamId)).map((invitee) => invitee.id),
      ]).size;
  const recipients = new Set([...userIds, ...teamMembers.map((person) => person.id)]).size + candidates.length + waiting;
  const chosen = instruments.filter((item) => items.includes(key(item)));
  const minutes = chosen.reduce((sum, item) => sum + item.minutes, 0);
  const today = new Date().toISOString().slice(0, 10);

  const visibleInstruments = useMemo(() => {
    const query = itemQuery.trim().toLowerCase();
    return instruments.filter((item) => !query || item.name.toLowerCase().includes(query));
  }, [instruments, itemQuery]);

  const visiblePeople = useMemo(() => {
    const query = peopleQuery.trim().toLowerCase();
    return people.filter(
      (person) => !query || person.name.toLowerCase().includes(query) || person.email.toLowerCase().includes(query)
    );
  }, [people, peopleQuery]);

  const toggle = (field: "items" | "teamIds" | "userIds" | "invitationIds", value: string) =>
    setValues((current) => ({
      ...current,
      [field]: current[field].includes(value) ? current[field].filter((entry) => entry !== value) : [...current[field], value],
    }));

  const choosePurpose = (value: (typeof PURPOSES)[number]) => {
    setValues((current) => ({
      ...current,
      purpose: value,
      // Clinical screens never go to candidates, and hiring rounds don't repeat.
      ...(value === "hiring" && {
        items: current.items.filter((entry) => !instruments.find((item) => key(item) === entry)?.sensitive),
        repeat: "0" as const,
      }),
    }));
  };

  const applyTemplate = (template: Template) => {
    const available = template.items.filter((entry) => {
      const item = instruments.find((instrument) => key(instrument) === entry);
      return item && !(item.sensitive && (template.purpose === "hiring" || !canSendSensitive));
    });
    setValues((current) => ({
      ...current,
      name: current.name || t(`templates.${template.key}.name` as "templates.leadership.name"),
      purpose: template.purpose,
      items: available,
      repeat: (template.repeat || "0") as RoundDraftData["repeat"],
      dueDate: inDays(template.dueDays),
      message: current.message || t(`templates.${template.key}.message` as "templates.leadership.message"),
    }));
    toast({ title: t("templateApplied") });
  };

  // Saves a draft shortly after each change, once there's something worth keeping.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (result || (!values.name.trim() && !values.items.length)) return;
    const timer = setTimeout(() => {
      saveRoundDraft(draftRef.current, values)
        .then(({ id }) => {
          draftRef.current = id;
          setDraftId(id);
          setSaved(true);
        })
        .catch(() => undefined);
    }, 800);
    return () => clearTimeout(timer);
  }, [values, result]);

  const submit = useMutation({
    mutationFn: async () => {
      const response = await createRound({
        name,
        purpose,
        message,
        items: chosen.map(({ kind, id }) => ({ kind, id })),
        dueDate: dueDate || null,
        userIds,
        teamIds,
        candidates,
        invitationIds: lifecycle ? [] : invitationIds,
        repeatMonths: lifecycle ? 0 : Number(repeat),
        lifecycle: lifecycle ? repeat : "",
        draftId,
      });
      if ("error" in response) {
        throw new Error(t(`errors.${response.error}`));
      }
      return response;
    },
    onSuccess: (response) => {
      if ("scheduled" in response) {
        toast({ title: t("lifecycleSaved") });
        router.push(`${base}/rounds`);
        return;
      }
      if (response.waiting) {
        toast({ title: t("waiting", { count: response.waiting }) });
      }
      if (response.links.length || response.skippedNames.length) {
        setResult(response);
      } else {
        toast({
          title: t("sent", { count: response.emailed }),
          description: response.queued ? t("queued", { count: response.queued }) : undefined,
        });
        router.push(`${base}/rounds/${response.roundId}`);
      }
    },
    onError: (error) => toast({ title: t("notSent"), description: error.message, variant: "destructive" }),
  });

  const emailInput = () => ({ name: name.trim() || t("namePlaceholder"), message, dueDate: dueDate || null });
  const preview = useMutation({ mutationFn: () => previewRoundEmail(emailInput()) });
  const testSend = useMutation({
    mutationFn: async () => {
      const response = await sendTestRoundEmail(emailInput());
      if ("error" in response) throw new Error(t(`testErrors.${response.error}`));
      return response;
    },
    onSuccess: ({ emailed }) => toast({ title: emailed ? t("testSent") : t("testNotEmailed") }),
    onError: (error) => toast({ title: common("error"), description: error.message, variant: "destructive" }),
  });

  const stepReady = [
    Boolean(name.trim() && chosen.length),
    // A start-date rule may cover everyone, so it doesn't need people picked now.
    (recipients > 0 || lifecycle) && invalid === 0,
    true,
    true,
  ];
  const ready = stepReady.every(Boolean);

  const goTo = (next: number) => {
    setStep(next);
    if (STEPS[next] === "review") preview.mutate();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const repeatLabel = (option: string) =>
    option === "0"
      ? t("once")
      : LIFECYCLE.includes(option)
        ? t(`lifecycle.${option}` as "lifecycle.start30")
        : rounds("every", { count: Number(option) });

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <nav aria-label={t("stepsLabel")} className="flex flex-col gap-2">
        <ol className="flex flex-wrap items-center gap-2 text-sm">
          {STEPS.map((entry, index) => {
            const reachable = index <= step || stepReady.slice(0, index).every(Boolean);
            const done = index < step && stepReady[index];
            return (
              <li key={entry} className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!reachable}
                  onClick={() => goTo(index)}
                  aria-current={index === step ? "step" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-3 py-1.5 transition-colors disabled:opacity-50",
                    index === step ? "border-primary bg-primary/5 font-medium" : "hover:bg-muted"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full font-mono text-xs",
                      done ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}
                  >
                    {done ? <Check className="size-3" aria-hidden /> : index + 1}
                  </span>
                  {t(`steps.${entry}`)}
                </button>
                {index < STEPS.length - 1 && <span className="h-px w-4 bg-border" aria-hidden />}
              </li>
            );
          })}
        </ol>
        <p className="min-h-4 font-mono text-xs text-muted-foreground" role="status">
          {saved ? t("draftSaved") : draftId ? t("draftOpen") : ""}
        </p>
      </nav>

      {STEPS[step] === "what" && (
        <>
          {templates.length > 0 && (
            <Section title={t("templatesTitle")} description={t("templatesText")}>
              <ul className="grid gap-2 sm:grid-cols-2">
                {templates.map((template) => (
                  <li key={template.key}>
                    <button
                      type="button"
                      onClick={() => applyTemplate(template)}
                      className="flex h-full w-full flex-col items-start gap-1 rounded-lg border p-3 text-left text-sm transition-colors hover:border-primary/40 hover:bg-muted"
                    >
                      <span className="flex items-center gap-2 font-medium">
                        <LayoutTemplate className="size-4 text-muted-foreground" aria-hidden />
                        {t(`templates.${template.key}.name` as "templates.leadership.name")}
                      </span>
                      <span className="text-muted-foreground">{t(`templates.${template.key}.text` as "templates.leadership.text")}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {rounds(`purposes.${template.purpose}`)} · {t("itemsCount", { count: template.items.length })}
                        {template.repeat ? ` · ${repeatLabel(template.repeat)}` : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title={t("about")}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="round-name">{t("name")}</Label>
              <Input
                id="round-name"
                required
                maxLength={200}
                placeholder={t("namePlaceholder")}
                value={name}
                onChange={(event) => set("name", event.target.value)}
              />
            </div>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-medium">{t("purpose")}</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {PURPOSES.map((value) => (
                  <label
                    key={value}
                    className={cn(
                      "flex cursor-pointer flex-col gap-1 rounded-lg border p-3 text-sm transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring",
                      purpose === value ? "border-primary bg-primary/5" : "hover:border-primary/40"
                    )}
                  >
                    <input
                      type="radio"
                      name="purpose"
                      value={value}
                      checked={purpose === value}
                      onChange={() => choosePurpose(value)}
                      className="sr-only"
                    />
                    <span className="font-medium">{rounds(`purposes.${value}`)}</span>
                    <span className="text-muted-foreground">{t(`purposeHints.${value}`)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </Section>

          <Section
            title={t("instruments")}
            description={chosen.length ? t("instrumentsChosen", { count: chosen.length, minutes }) : t("instrumentsText")}
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label={t("searchInstruments")}
                placeholder={t("searchInstruments")}
                className="pl-9"
                value={itemQuery}
                onChange={(event) => setItemQuery(event.target.value)}
              />
            </div>
            <ul className="max-h-80 divide-y overflow-y-auto rounded-lg border">
              {visibleInstruments.map((item) => {
                const blocked = item.sensitive && (hiring || !canSendSensitive);
                const id = `item-${item.kind}-${item.id}`;
                const Icon = item.kind === "test" ? FlaskConical : NotepadText;
                return (
                  <li key={key(item)} className={cn("flex items-start gap-3 p-3", blocked && "opacity-60")}>
                    <Checkbox
                      id={id}
                      checked={items.includes(key(item))}
                      disabled={blocked}
                      onCheckedChange={() => toggle("items", key(item))}
                      className="mt-0.5"
                    />
                    <label htmlFor={id} className="flex min-w-0 flex-1 cursor-pointer flex-col gap-1 text-sm">
                      <span className="flex items-start gap-2 font-medium leading-snug">
                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                        {item.name}
                      </span>
                      <span className="flex flex-wrap gap-2 text-muted-foreground">
                        {common("minutes", { count: item.minutes })}
                        {item.sensitive && <Badge variant="outline">{t("clinical")}</Badge>}
                        {item.retestDays > 0 && <Badge variant="outline">{t("retest", { days: item.retestDays })}</Badge>}
                      </span>
                      {blocked && hiring && <span className="text-xs text-muted-foreground">{t("notForHiring")}</span>}
                    </label>
                  </li>
                );
              })}
            </ul>
            <TimeBudget chosen={chosen} minutes={minutes} />
          </Section>
        </>
      )}

      {STEPS[step] === "who" && (
        <Section
          title={t("people")}
          description={lifecycle && recipients === 0 ? t("lifecycleEveryone") : t("recipients", { count: recipients })}
        >
          {teams.length > 0 && (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-medium">{t("teams")}</legend>
              <div className="flex flex-wrap gap-2">
                {teams.map((team) => (
                  <label
                    key={team.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm",
                      teamIds.includes(team.id) && "border-primary bg-primary/5"
                    )}
                  >
                    <Checkbox checked={teamIds.includes(team.id)} onCheckedChange={() => toggle("teamIds", team.id)} />
                    {team.name}
                  </label>
                ))}
              </div>
              {repeat !== "0" && teamIds.length > 0 && <p className="text-sm text-muted-foreground">{t("teamsRepeatHint")}</p>}
            </fieldset>
          )}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">{t("individuals")}</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label={t("searchPeople")}
                placeholder={t("searchPeople")}
                className="pl-9"
                value={peopleQuery}
                onChange={(event) => setPeopleQuery(event.target.value)}
              />
            </div>
            <ul className="max-h-72 divide-y overflow-y-auto rounded-lg border">
              {visiblePeople.map((person) => {
                const viaTeam = person.teamId !== null && teamIds.includes(person.teamId);
                const id = `person-${person.id}`;
                return (
                  <li key={person.id} className="flex items-center gap-3 p-3">
                    <Checkbox
                      id={id}
                      checked={viaTeam || userIds.includes(person.id)}
                      disabled={viaTeam}
                      onCheckedChange={() => toggle("userIds", person.id)}
                    />
                    <label htmlFor={id} className="flex min-w-0 flex-1 cursor-pointer flex-col text-sm">
                      <span className="font-medium">{person.name}</span>
                      <span className="truncate text-muted-foreground">{person.email}</span>
                    </label>
                    {viaTeam && <Badge variant="secondary">{t("viaTeam")}</Badge>}
                  </li>
                );
              })}
              {!hiring &&
                !lifecycle &&
                invitees
                  .filter((invitee) => {
                    const query = peopleQuery.trim().toLowerCase();
                    return !query || invitee.email.includes(query) || invitee.name.toLowerCase().includes(query);
                  })
                  .map((invitee) => {
                    const viaTeam = invitee.teamId !== null && teamIds.includes(invitee.teamId);
                    const id = `invitee-${invitee.id}`;
                    return (
                      <li key={invitee.id} className="flex items-center gap-3 p-3">
                        <Checkbox
                          id={id}
                          checked={viaTeam || invitationIds.includes(invitee.id)}
                          disabled={viaTeam}
                          onCheckedChange={() => toggle("invitationIds", invitee.id)}
                        />
                        <label htmlFor={id} className="flex min-w-0 flex-1 cursor-pointer flex-col text-sm">
                          <span className="font-medium">{invitee.name || invitee.email}</span>
                          <span className="truncate text-muted-foreground">{invitee.email}</span>
                        </label>
                        <Badge variant="outline">{t("invited")}</Badge>
                      </li>
                    );
                  })}
            </ul>
            {waiting > 0 && <p className="text-sm text-muted-foreground">{t("inviteesHint")}</p>}
          </div>
          {hiring && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="candidates">{t("candidates")}</Label>
              <Textarea
                id="candidates"
                rows={4}
                placeholder={t("candidatesPlaceholder")}
                value={candidateText}
                onChange={(event) => set("candidateText", event.target.value)}
              />
              <p className={cn("text-sm", invalid ? "text-destructive" : "text-muted-foreground")}>
                {invalid ? t("candidatesInvalid", { count: invalid }) : t("candidatesHint")}
              </p>
            </div>
          )}
        </Section>
      )}

      {STEPS[step] === "when" && (
        <Section title={t("timing")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="due-date">{t("dueDate")}</Label>
              <Input id="due-date" type="date" min={today} value={dueDate} onChange={(event) => set("dueDate", event.target.value)} />
              <div className="flex flex-wrap gap-1.5">
                {[7, 14, 30].map((days) => (
                  <Button key={days} type="button" size="sm" variant="outline" onClick={() => set("dueDate", inDays(days))}>
                    {t("inDays", { count: days })}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="repeat">{t("repeat")}</Label>
              <Select value={repeat} onValueChange={(value) => set("repeat", value as RoundDraftData["repeat"])} disabled={hiring}>
                <SelectTrigger id="repeat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPEATS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {repeatLabel(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {hiring ? t("hiringOnce") : lifecycle ? t("lifecycleHint") : t("repeatHint")}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="message">{t("message")}</Label>
            <Textarea
              id="message"
              rows={3}
              maxLength={2000}
              placeholder={t("messagePlaceholder")}
              value={message}
              onChange={(event) => set("message", event.target.value)}
            />
          </div>
          <p className="text-sm text-muted-foreground">{t("quietHint")}</p>
        </Section>
      )}

      {STEPS[step] === "review" && (
        <>
          <Section title={t("reviewTitle")}>
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[10rem_1fr]">
              <dt className="text-muted-foreground">{t("name")}</dt>
              <dd className="font-medium">{name}</dd>
              <dt className="text-muted-foreground">{t("purpose")}</dt>
              <dd>{rounds(`purposes.${purpose}`)}</dd>
              <dt className="text-muted-foreground">{t("instruments")}</dt>
              <dd>
                <ul className="flex flex-col gap-0.5">
                  {chosen.map((item) => (
                    <li key={key(item)} className="flex justify-between gap-4">
                      <span>{item.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">{common("minutes", { count: item.minutes })}</span>
                    </li>
                  ))}
                </ul>
                <TimeBudget chosen={chosen} minutes={minutes} compact />
              </dd>
              <dt className="text-muted-foreground">{t("people")}</dt>
              <dd>{lifecycle && recipients === 0 ? t("lifecycleEveryone") : t("recipients", { count: recipients })}</dd>
              <dt className="text-muted-foreground">{t("dueDate")}</dt>
              <dd>{dueDate || t("noDue")}</dd>
              <dt className="text-muted-foreground">{t("repeat")}</dt>
              <dd>{repeatLabel(repeat)}</dd>
            </dl>
          </Section>

          <Section
            title={t("emailTitle")}
            description={preview.data ? t("emailSubject", { subject: preview.data.subject }) : t("emailText")}
          >
            <div className="overflow-hidden rounded-lg border bg-white">
              {preview.data ? (
                <iframe title={t("emailTitle")} srcDoc={preview.data.html} sandbox="" className="h-[28rem] w-full" />
              ) : (
                <p className="p-6 text-sm text-muted-foreground">{t("emailLoading")}</p>
              )}
            </div>
            <Button type="button" variant="outline" className="w-fit" disabled={testSend.isPending} onClick={() => testSend.mutate()}>
              <Mail className="h-4 w-4" />
              {t("testSend")}
            </Button>
          </Section>
        </>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {step > 0 && (
          <Button type="button" variant="outline" onClick={() => goTo(step - 1)}>
            <ArrowLeft className="h-4 w-4" />
            {common("back")}
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button type="button" disabled={!stepReady[step]} onClick={() => goTo(step + 1)}>
            {t("continue")}
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="button" disabled={!ready || submit.isPending} onClick={() => submit.mutate()}>
            {lifecycle ? t("saveLifecycle") : t("send", { count: recipients })}
          </Button>
        )}
        {!stepReady[step] && (
          <p className="text-sm text-muted-foreground">{t(`incompleteSteps.${STEPS[step]}` as "incompleteSteps.what")}</p>
        )}
      </div>

      <Dialog
        open={result !== null}
        onOpenChange={(open) => {
          if (!open && result) router.push(`${base}/rounds/${result.roundId}`);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("sentTitle")}</DialogTitle>
            <DialogDescription>{t("sent", { count: result?.emailed ?? 0 })}</DialogDescription>
          </DialogHeader>
          {result && result.links.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-sm">{t("linksText")}</p>
              <ul className="flex max-h-64 flex-col gap-2 overflow-y-auto">
                {result.links.map(({ name: person, link }) => (
                  <li key={link} className="flex items-center gap-2 rounded-lg border p-2 text-sm">
                    <span className="min-w-0 flex-1 truncate font-medium">{person}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(link);
                        toast({ title: rounds("linkCopied") });
                      }}
                    >
                      <Copy className="h-4 w-4" />
                      {rounds("copyLink")}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result && result.skippedNames.length > 0 && (
            <p className="text-sm text-muted-foreground">{t("skipped", { names: result.skippedNames.join(", ") })}</p>
          )}
          <DialogFooter>
            <Button type="button" onClick={() => result && router.push(`${base}/rounds/${result.roundId}`)}>
              {t("openRound")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
