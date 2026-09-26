"use client";

import { createRound, type CreateRoundResult } from "@/actions/round/round-actions";
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
import { cn } from "@/utils/utils";
import { useMutation } from "@tanstack/react-query";
import { Copy, FlaskConical, NotepadText, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

const PURPOSES = ["development", "hiring", "wellbeing"] as const;
const REPEATS = [0, 1, 3, 6, 12] as const;

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

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
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

export function RoundForm({
  instruments,
  people,
  teams,
  invitees = [],
  canSendSensitive,
}: {
  instruments: Instrument[];
  people: Person[];
  teams: Team[];
  invitees?: Invitee[];
  canSendSensitive: boolean;
}) {
  const t = useTranslations("rounds.form");
  const rounds = useTranslations("rounds");
  const common = useTranslations("common");
  const router = useRouter();
  const base = useOrganizationBase();

  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState<(typeof PURPOSES)[number]>("development");
  const [items, setItems] = useState<string[]>([]);
  const [itemQuery, setItemQuery] = useState("");
  const [teamIds, setTeamIds] = useState<string[]>([]);
  const [userIds, setUserIds] = useState<string[]>([]);
  const [invitationIds, setInvitationIds] = useState<string[]>([]);
  const [peopleQuery, setPeopleQuery] = useState("");
  const [candidateText, setCandidateText] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [message, setMessage] = useState("");
  const [repeat, setRepeat] = useState<(typeof REPEATS)[number]>(0);
  const [result, setResult] = useState<Extract<CreateRoundResult, { ok: true }> | null>(null);

  const hiring = purpose === "hiring";
  const { candidates, invalid } = parseCandidates(hiring ? candidateText : "");
  const teamMembers = people.filter((person) => person.teamId && teamIds.includes(person.teamId));
  const waiting = new Set([
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

  const toggle = (list: string[], set: (value: string[]) => void, value: string) =>
    set(list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value]);

  const choosePurpose = (value: (typeof PURPOSES)[number]) => {
    setPurpose(value);
    if (value === "hiring") {
      // Clinical screens never go to candidates, and hiring rounds don't repeat.
      setItems((current) => current.filter((entry) => !instruments.find((item) => key(item) === entry)?.sensitive));
      setRepeat(0);
    }
  };

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
        invitationIds,
        repeatMonths: repeat,
      });
      if ("error" in response) {
        throw new Error(t(`errors.${response.error}`));
      }
      return response;
    },
    onSuccess: (response) => {
      if (response.waiting) {
        toast({ title: t("waiting", { count: response.waiting }) });
      }
      if (response.links.length || response.skippedNames.length) {
        setResult(response);
      } else {
        toast({ title: t("sent", { count: response.emailed }) });
        router.push(`${base}/rounds/${response.roundId}`);
      }
    },
    onError: (error) => toast({ title: t("notSent"), description: error.message, variant: "destructive" }),
  });

  const ready = name.trim() && chosen.length && recipients > 0 && invalid === 0;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (ready) submit.mutate();
  };

  return (
    <form onSubmit={onSubmit} className="flex max-w-3xl flex-col gap-6">
      <Section title={t("about")}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="round-name">{t("name")}</Label>
          <Input
            id="round-name"
            required
            maxLength={200}
            placeholder={t("namePlaceholder")}
            value={name}
            onChange={(event) => setName(event.target.value)}
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
                  onCheckedChange={() => toggle(items, setItems, key(item))}
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
      </Section>

      <Section title={t("people")} description={t("recipients", { count: recipients })}>
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
                  <Checkbox checked={teamIds.includes(team.id)} onCheckedChange={() => toggle(teamIds, setTeamIds, team.id)} />
                  {team.name}
                </label>
              ))}
            </div>
            {repeat > 0 && teamIds.length > 0 && <p className="text-sm text-muted-foreground">{t("teamsRepeatHint")}</p>}
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
                    onCheckedChange={() => toggle(userIds, setUserIds, person.id)}
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
                        onCheckedChange={() => toggle(invitationIds, setInvitationIds, invitee.id)}
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
          {!hiring && waiting > 0 && <p className="text-sm text-muted-foreground">{t("inviteesHint")}</p>}
        </div>
        {hiring && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="candidates">{t("candidates")}</Label>
            <Textarea
              id="candidates"
              rows={4}
              placeholder={t("candidatesPlaceholder")}
              value={candidateText}
              onChange={(event) => setCandidateText(event.target.value)}
            />
            <p className={cn("text-sm", invalid ? "text-destructive" : "text-muted-foreground")}>
              {invalid ? t("candidatesInvalid", { count: invalid }) : t("candidatesHint")}
            </p>
          </div>
        )}
      </Section>

      <Section title={t("timing")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="due-date">{t("dueDate")}</Label>
            <Input id="due-date" type="date" min={today} value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="repeat">{t("repeat")}</Label>
            <Select value={String(repeat)} onValueChange={(value) => setRepeat(Number(value) as typeof repeat)} disabled={hiring}>
              <SelectTrigger id="repeat">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPEATS.map((months) => (
                  <SelectItem key={months} value={String(months)}>
                    {months ? rounds("every", { count: months }) : t("once")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">{hiring ? t("hiringOnce") : t("repeatHint")}</p>
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
            onChange={(event) => setMessage(event.target.value)}
          />
        </div>
      </Section>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={!ready || submit.isPending}>
          {t("send", { count: recipients })}
        </Button>
        {!ready && <p className="text-sm text-muted-foreground">{t("incomplete")}</p>}
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
    </form>
  );
}
