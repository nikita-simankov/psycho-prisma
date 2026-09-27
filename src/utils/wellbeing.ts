import { z } from "zod";
import { localTime } from "./quiet-hours";
import { groupAverages, hiddenGroups, MIN_GROUP } from "./results";
import type { ScaleRow } from "./scoring";

// Wellbeing rules: which scales signal strain, where a team average or one person's score
// becomes worrying, and what counts as a sharp change between two rounds. Pure, so the hourly job,
// the settings and the tests share one reading.

// "high": higher scores are worse (burnout, anxiety). "low": lower scores are worse (engagement).
export const DIRECTIONS = ["high", "low"] as const;
export type Direction = (typeof DIRECTIONS)[number];

export const ruleSchema = z
  .object({
    id: z.string().min(1).max(40),
    // Shown in alerts, e.g. "Burnout". Empty means the scale's own name.
    label: z.string().trim().max(60),
    testId: z.string().min(1).max(64),
    scaleId: z.number().int(),
    direction: z.enum(DIRECTIONS),
    // A team average at or past this raises an alert; null to skip.
    team: z.number().finite().nullable(),
    // A change for the worse of at least this much since the previous round raises an alert.
    drop: z.number().finite().positive().nullable(),
    // One person's score at or past this shows them support and asks a psychologist to follow up.
    person: z.number().finite().nullable(),
  })
  .strict();

export type WellbeingRule = z.infer<typeof ruleSchema>;
export const rulesSchema = z.array(ruleSchema).max(50);

const HADS = "15196848-f2bc-4326-81ef-5cbacb1c0c44";
const BECK = "1cac7c84-3036-4328-9fb1-d393607e43b9";
const SPIELBERGER = "dcc97f00-dde5-4a46-82a8-2e33726c4843";
const PROGNOZ = "5812bacd-c9f1-4757-a0a9-b7e0413e7baa";
const CP45 = "8ec7eb57-ae13-40f7-8322-023fe34c02d6";

// Starting rules on the library's screens, from their published cut-offs: HADS 8+ is subclinical
// and 11+ clinical, Beck 16+ moderate and 20+ marked, Spielberger–Khanin 45+ high anxiety,
// Prognoz-2 stens 1–3 low stability, CP-45 0.60+ a risk group.
export const DEFAULT_RULES: WellbeingRule[] = [
  { id: "hads-anxiety", label: "", testId: HADS, scaleId: 1, direction: "high", team: 8, drop: 2, person: 11 },
  { id: "hads-depression", label: "", testId: HADS, scaleId: 2, direction: "high", team: 8, drop: 2, person: 11 },
  { id: "beck", label: "", testId: BECK, scaleId: 1, direction: "high", team: 16, drop: 4, person: 20 },
  { id: "anxiety", label: "", testId: SPIELBERGER, scaleId: 2, direction: "high", team: 45, drop: 5, person: 45 },
  { id: "stability", label: "", testId: PROGNOZ, scaleId: 2, direction: "low", team: 3.5, drop: 1.5, person: 3 },
  { id: "suicide-risk", label: "", testId: CP45, scaleId: 1, direction: "high", team: null, drop: null, person: 0.6 },
];

// The organization's rules; an empty setting means the defaults.
export function parseRules(json: string): WellbeingRule[] {
  if (!json) return DEFAULT_RULES;
  try {
    const parsed = rulesSchema.safeParse(JSON.parse(json));
    return parsed.success ? parsed.data : DEFAULT_RULES;
  } catch {
    return DEFAULT_RULES;
  }
}

// The score a rule reads: the sten or T-score where the test has norms, otherwise the raw score.
export function scoreValue(row: Pick<ScaleRow, "stan" | "tGrade" | "rawGrade" | "correctedGrade">): number | null {
  return row.stan ?? row.tGrade ?? row.correctedGrade ?? row.rawGrade;
}

// Whether a value is at or past a limit in the worrying direction.
export function isPast(direction: Direction, value: number, limit: number) {
  return direction === "high" ? value >= limit : value <= limit;
}

// How much worse `current` is than `previous`; negative when it improved.
export function worsening(direction: Direction, current: number, previous: number) {
  return direction === "high" ? current - previous : previous - current;
}

const round1 = (value: number) => Math.round(value * 10) / 10;

// The group's mean, or null for groups smaller than MIN_GROUP, which are never read.
export function groupMean(values: number[]): number | null {
  if (values.length < MIN_GROUP) return null;
  return round1(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export type AlertKind = "threshold" | "drop";
export type Finding = { kind: AlertKind; value: number; previous: number | null; limit: number; people: number };

// What a team's scores on one rule call for: past the team level, a sharp change for the worse
// since the previous round, both or neither. Either round with fewer than MIN_GROUP scores counts
// as no data.
export function detectAlerts(rule: Pick<WellbeingRule, "direction" | "team" | "drop">, current: number[], previous: number[] | null): Finding[] {
  const now = groupMean(current);
  if (now === null) return [];
  const before = previous ? groupMean(previous) : null;
  const findings: Finding[] = [];
  if (rule.team !== null && isPast(rule.direction, now, rule.team)) {
    findings.push({ kind: "threshold", value: now, previous: before, limit: rule.team, people: current.length });
  }
  if (rule.drop !== null && before !== null && worsening(rule.direction, now, before) >= rule.drop) {
    findings.push({ kind: "drop", value: now, previous: before, limit: rule.drop, people: current.length });
  }
  return findings;
}

// The rules one person's result crosses at the personal level.
export function personCrossings(rules: WellbeingRule[], testId: string, rows: ScaleRow[]): WellbeingRule[] {
  return rules.filter((rule) => {
    if (rule.testId !== testId || rule.person === null) return false;
    const row = rows.find((entry) => entry.scaleId === rule.scaleId);
    const value = row ? scoreValue(row) : null;
    return value !== null && isPast(rule.direction, value, rule.person);
  });
}

// Anonymous pulse rounds. Only wellbeing rounds can be anonymous, and only with tests: free-text
// questionnaire answers can name or describe the person who wrote them.
export function anonymityProblem(purpose: string, items: { kind: "test" | "form" }[]): "anonymousNeedsWellbeing" | "anonymousForms" | null {
  if (purpose !== "wellbeing") return "anonymousNeedsWellbeing";
  if (items.some((item) => item.kind === "form")) return "anonymousForms";
  return null;
}

// Anonymous results wait until the round is closed or past due. While answers still arrive, a
// team average that moves right after one person finishes would give their answers away.
export function pulseResultsReady(round: { closedAt: Date | null; dueAt: Date | null }, now = new Date()) {
  return round.closedAt !== null || (round.dueAt !== null && round.dueAt < now);
}

// Team and organization averages of anonymous responses, with the teams too small to show.
// Responses carry no person, so each one counts as its own entry.
export function pulseGroups(responses: { id: string; teamId: string | null; rows: ScaleRow[] }[], teams: { id: string; name: string }[]) {
  const entries = responses.map((response) => ({ userId: response.id, teamId: response.teamId, rows: response.rows }));
  return { groups: groupAverages(entries, teams), hidden: hiddenGroups(entries, teams) };
}

// Leadership digest.

export const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0] as const;
const DIGEST_GAP = 6 * 24 * 60 * 60_000;

// Due on the chosen weekday in the organization's time zone, at most once a week.
export function digestDue(now: Date, weekday: number, lastSentAt: Date | null, timeZone?: string) {
  if (localTime(now, timeZone || undefined).weekday !== weekday) return false;
  return !lastSentAt || now.getTime() - lastSentAt.getTime() >= DIGEST_GAP;
}

export type DigestInput = {
  // Assignments in rounds that are open or closed this week, and how many are finished.
  assigned: number;
  completed: number;
  completedThisWeek: number;
  // Organization-wide averages per rule in its latest two rounds with enough people.
  trends: { label: string; direction: Direction; current: number; previous: number | null; people: number }[];
  alerts: { team: string; label: string; kind: AlertKind }[];
  actions: { team: string | null; text: string; status: ActionStatus }[];
};

export type DigestSummary = {
  participation: { assigned: number; completed: number; percent: number | null; thisWeek: number };
  trends: { label: string; current: number; previous: number | null; change: number | null; trend: "better" | "worse" | "steady" | "new" }[];
  alerts: DigestInput["alerts"];
  actions: { done: number; inProgress: number; planned: number; items: DigestInput["actions"] };
  // Nothing worth a leadership email this week.
  empty: boolean;
};

// Changes smaller than this are shown as steady.
const STEADY = 0.3;

// What the weekly email says: group figures only, so a trend needs MIN_GROUP people.
export function digestSummary(input: DigestInput): DigestSummary {
  const trends = input.trends
    .filter((trend) => trend.people >= MIN_GROUP)
    .map((trend) => {
      const change = trend.previous === null ? null : round1(trend.current - trend.previous);
      const worse = trend.previous === null ? 0 : worsening(trend.direction, trend.current, trend.previous);
      return {
        label: trend.label,
        current: trend.current,
        previous: trend.previous,
        change,
        trend: change === null ? ("new" as const) : Math.abs(worse) < STEADY ? ("steady" as const) : worse > 0 ? ("worse" as const) : ("better" as const),
      };
    });
  const count = (status: ActionStatus) => input.actions.filter((action) => action.status === status).length;

  return {
    participation: {
      assigned: input.assigned,
      completed: input.completed,
      percent: input.assigned ? Math.round((input.completed / input.assigned) * 100) : null,
      thisWeek: input.completedThisWeek,
    },
    trends,
    alerts: input.alerts,
    actions: { done: count("done"), inProgress: count("inProgress"), planned: count("planned"), items: input.actions },
    empty: !input.assigned && !trends.length && !input.alerts.length && !input.actions.length,
  };
}

// "You said, we did": what staff do about a pulse round's results, per team.
export const ACTION_STATUSES = ["planned", "inProgress", "done"] as const;
export type ActionStatus = (typeof ACTION_STATUSES)[number];

// Support resources shown after a worrying screening result: the organization's own words,
// contacts such as an employee assistance programme, and links.
export const supportLinkSchema = z.object({
  label: z.string().trim().min(1).max(80),
  url: z
    .string()
    .trim()
    .max(500)
    .refine((value) => /^(https?:\/\/|mailto:|tel:)/i.test(value)),
});
export type SupportLink = z.infer<typeof supportLinkSchema>;
export type Support = { text: string; contacts: string; links: SupportLink[] };

export function parseSupportLinks(json: string): SupportLink[] {
  try {
    const parsed = z.array(supportLinkSchema).safeParse(JSON.parse(json));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}
