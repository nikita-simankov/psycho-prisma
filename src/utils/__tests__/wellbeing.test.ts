import { describe, expect, it } from "vitest";
import type { ScaleRow } from "../scoring";
import {
  anonymityProblem,
  DEFAULT_RULES,
  detectAlerts,
  digestDue,
  digestSummary,
  groupMean,
  parseRules,
  parseSupportLinks,
  personCrossings,
  pulseGroups,
  pulseResultsReady,
  scoreValue,
  type WellbeingRule,
} from "../wellbeing";

const burnout: WellbeingRule = { id: "burnout", label: "Burnout", testId: "pulse", scaleId: 1, direction: "high", team: 7, drop: 1, person: 9 };
const engagement: WellbeingRule = { id: "engagement", label: "Engagement", testId: "pulse", scaleId: 2, direction: "low", team: 4, drop: 1.5, person: 2 };

const row = (scaleId: number, values: Partial<ScaleRow>): ScaleRow => ({
  scaleId,
  scaleName: `Scale ${scaleId}`,
  rawGrade: null,
  correctedGrade: null,
  tGrade: null,
  stan: null,
  summary: null,
  ...values,
});

describe("scoreValue", () => {
  it("reads the sten, then the T-score, then the corrected and raw scores", () => {
    expect(scoreValue(row(1, { stan: 7, tGrade: 60, rawGrade: 20 }))).toBe(7);
    expect(scoreValue(row(1, { tGrade: 60, rawGrade: 20 }))).toBe(60);
    expect(scoreValue(row(1, { correctedGrade: 22, rawGrade: 20 }))).toBe(22);
    expect(scoreValue(row(1, { rawGrade: 20 }))).toBe(20);
    expect(scoreValue(row(1, {}))).toBeNull();
  });
});

describe("groupMean", () => {
  it("never reads groups under five", () => {
    expect(groupMean([8, 8, 8, 8])).toBeNull();
    expect(groupMean([8, 8, 8, 8, 9])).toBe(8.2);
  });
});

describe("detectAlerts", () => {
  it("raises a threshold alert when the team average reaches the level", () => {
    expect(detectAlerts(burnout, [7, 7, 7, 7, 7], null)).toEqual([{ kind: "threshold", value: 7, previous: null, limit: 7, people: 5 }]);
    expect(detectAlerts(burnout, [6, 7, 7, 7, 7], null)).toEqual([]);
  });

  it("reads low-is-worse scales the other way", () => {
    expect(detectAlerts(engagement, [3, 4, 4, 4, 4], null).map((finding) => finding.kind)).toEqual(["threshold"]);
    expect(detectAlerts(engagement, [5, 5, 5, 5, 5], null)).toEqual([]);
  });

  it("raises a drop alert on a sharp change for the worse since the previous round", () => {
    const findings = detectAlerts({ ...burnout, team: null }, [6, 6, 6, 6, 6], [5, 5, 5, 5, 5]);
    expect(findings).toEqual([{ kind: "drop", value: 6, previous: 5, limit: 1, people: 5 }]);
    // An improvement or a small change is no drop.
    expect(detectAlerts({ ...burnout, team: null }, [4, 4, 4, 4, 4], [5, 5, 5, 5, 5])).toEqual([]);
    expect(detectAlerts({ ...burnout, team: null }, [5.5, 5.5, 5.5, 5.5, 5.5], [5, 5, 5, 5, 5])).toEqual([]);
    // Engagement falling is worse.
    expect(detectAlerts({ ...engagement, team: null }, [5, 5, 5, 5, 5], [7, 7, 7, 7, 7]).map((finding) => finding.kind)).toEqual(["drop"]);
  });

  it("can raise both at once", () => {
    expect(detectAlerts(burnout, [8, 8, 8, 8, 8], [6, 6, 6, 6, 6]).map((finding) => finding.kind)).toEqual(["threshold", "drop"]);
  });

  it("ignores rounds with fewer than five scores, now or before", () => {
    expect(detectAlerts(burnout, [9, 9, 9, 9], null)).toEqual([]);
    expect(detectAlerts({ ...burnout, team: null }, [9, 9, 9, 9, 9], [1, 1, 1, 1])).toEqual([]);
  });

  it("skips levels that are turned off", () => {
    expect(detectAlerts({ ...burnout, team: null, drop: null }, [10, 10, 10, 10, 10], [1, 1, 1, 1, 1])).toEqual([]);
  });
});

describe("personCrossings", () => {
  const rows = [row(1, { rawGrade: 9 }), row(2, { rawGrade: 3 })];

  it("finds the rules one person's result crosses", () => {
    expect(personCrossings([burnout, engagement], "pulse", rows).map((rule) => rule.id)).toEqual(["burnout"]);
    expect(personCrossings([burnout, engagement], "pulse", [row(1, { rawGrade: 2 }), row(2, { rawGrade: 2 })]).map((rule) => rule.id)).toEqual([
      "engagement",
    ]);
  });

  it("only reads rules on the same test with a personal level", () => {
    expect(personCrossings([burnout], "other", rows)).toEqual([]);
    expect(personCrossings([{ ...burnout, person: null }], "pulse", rows)).toEqual([]);
  });
});

describe("parseRules", () => {
  it("falls back to the defaults when empty or broken", () => {
    expect(parseRules("")).toBe(DEFAULT_RULES);
    expect(parseRules("{not json")).toBe(DEFAULT_RULES);
    expect(parseRules(JSON.stringify([{ id: "x" }]))).toBe(DEFAULT_RULES);
  });

  it("keeps a saved list, even an empty one", () => {
    expect(parseRules(JSON.stringify([burnout]))).toEqual([burnout]);
    expect(parseRules("[]")).toEqual([]);
  });

  it("has sensible defaults on the library's screens", () => {
    expect(DEFAULT_RULES.length).toBeGreaterThan(0);
    for (const rule of DEFAULT_RULES) {
      expect(rule.team !== null || rule.person !== null).toBe(true);
    }
  });
});

describe("anonymity", () => {
  it("allows anonymous rounds only for wellbeing, with tests only", () => {
    expect(anonymityProblem("wellbeing", [{ kind: "test" }])).toBeNull();
    expect(anonymityProblem("development", [{ kind: "test" }])).toBe("anonymousNeedsWellbeing");
    expect(anonymityProblem("hiring", [{ kind: "test" }])).toBe("anonymousNeedsWellbeing");
    expect(anonymityProblem("wellbeing", [{ kind: "test" }, { kind: "form" }])).toBe("anonymousForms");
  });

  it("holds results back while answers still arrive", () => {
    const now = new Date("2026-09-27T12:00:00Z");
    expect(pulseResultsReady({ closedAt: null, dueAt: null }, now)).toBe(false);
    expect(pulseResultsReady({ closedAt: null, dueAt: new Date("2026-09-28T00:00:00Z") }, now)).toBe(false);
    expect(pulseResultsReady({ closedAt: null, dueAt: new Date("2026-09-26T00:00:00Z") }, now)).toBe(true);
    expect(pulseResultsReady({ closedAt: new Date("2026-09-27T10:00:00Z"), dueAt: null }, now)).toBe(true);
  });

  it("shows only groups of five or more, and says which were hidden", () => {
    const responses = [
      ...Array.from({ length: 5 }, (_, index) => ({ id: `a${index}`, teamId: "sales", rows: [row(1, { rawGrade: 6 })] })),
      ...Array.from({ length: 3 }, (_, index) => ({ id: `b${index}`, teamId: "legal", rows: [row(1, { rawGrade: 9 })] })),
    ];
    const { groups, hidden } = pulseGroups(responses, [
      { id: "legal", name: "Legal" },
      { id: "sales", name: "Sales" },
    ]);
    expect(groups.map((group) => group.key)).toEqual(["all", "sales"]);
    expect(groups.find((group) => group.key === "sales")?.scales[0].average).toBe(6);
    expect(hidden).toEqual([{ key: "legal", teamName: "Legal", people: 3 }]);
  });
});

describe("digestDue", () => {
  // A Monday.
  const monday = new Date("2026-09-28T09:00:00Z");

  it("goes out on the chosen weekday", () => {
    expect(digestDue(monday, 1, null, "UTC")).toBe(true);
    expect(digestDue(monday, 2, null, "UTC")).toBe(false);
  });

  it("goes out at most once a week", () => {
    expect(digestDue(monday, 1, new Date("2026-09-28T08:00:00Z"), "UTC")).toBe(false);
    expect(digestDue(monday, 1, new Date("2026-09-21T08:00:00Z"), "UTC")).toBe(true);
  });

  it("reads the weekday in the organization's time zone", () => {
    // Still Sunday in Los Angeles.
    expect(digestDue(new Date("2026-09-28T03:00:00Z"), 0, null, "America/Los_Angeles")).toBe(true);
  });
});

describe("digestSummary", () => {
  const input = {
    assigned: 20,
    completed: 12,
    completedThisWeek: 5,
    trends: [
      { label: "Burnout", direction: "high" as const, current: 6.4, previous: 5.2, people: 12 },
      { label: "Engagement", direction: "low" as const, current: 6.4, previous: 5.2, people: 12 },
      { label: "Stress", direction: "high" as const, current: 5.1, previous: 5, people: 8 },
      { label: "New", direction: "high" as const, current: 4, previous: null, people: 6 },
      { label: "Small", direction: "high" as const, current: 9, previous: 1, people: 4 },
    ],
    alerts: [{ team: "Sales", label: "Burnout", kind: "threshold" as const }],
    actions: [
      { team: "Sales", text: "No Friday meetings", status: "done" as const },
      { team: null, text: "Quiet hours", status: "inProgress" as const },
    ],
  };

  it("sums up participation", () => {
    expect(digestSummary(input).participation).toEqual({ assigned: 20, completed: 12, percent: 60, thisWeek: 5 });
    expect(digestSummary({ ...input, assigned: 0, completed: 0 }).participation.percent).toBeNull();
  });

  it("reads each trend in its own direction and drops groups under five", () => {
    const trends = digestSummary(input).trends;
    expect(trends.map((trend) => [trend.label, trend.trend])).toEqual([
      ["Burnout", "worse"],
      ["Engagement", "better"],
      ["Stress", "steady"],
      ["New", "new"],
    ]);
    expect(trends[0].change).toBe(1.2);
  });

  it("counts actions by status and knows a quiet week", () => {
    const summary = digestSummary(input);
    expect(summary.actions).toMatchObject({ done: 1, inProgress: 1, planned: 0 });
    expect(summary.empty).toBe(false);
    expect(digestSummary({ assigned: 0, completed: 0, completedThisWeek: 0, trends: [], alerts: [], actions: [] }).empty).toBe(true);
  });
});

describe("parseSupportLinks", () => {
  it("keeps web, mail and phone links only", () => {
    expect(parseSupportLinks(JSON.stringify([{ label: "EAP", url: "https://eap.example.com" }]))).toHaveLength(1);
    expect(parseSupportLinks(JSON.stringify([{ label: "Bad", url: "javascript:alert(1)" }]))).toEqual([]);
    expect(parseSupportLinks("oops")).toEqual([]);
  });
});
