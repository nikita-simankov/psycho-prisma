import { describe, expect, it } from "vitest";
import { lifecycleDue } from "../lifecycle";
import { isWorkingHour, nextWorkingHour, sendTime } from "../quiet-hours";
import { roundHealth } from "../round-health";

describe("quiet hours", () => {
  it("knows working hours in the person's time zone", () => {
    // Wednesday 10:00 UTC is 13:00 in Moscow and 06:00 in New York.
    const wednesday = new Date("2026-09-23T10:00:00Z");
    expect(isWorkingHour(wednesday, "Europe/Moscow")).toBe(true);
    expect(isWorkingHour(wednesday, "America/New_York")).toBe(false);
  });

  it("moves weekend emails to Monday morning", () => {
    const saturday = new Date("2026-09-26T12:00:00Z");
    const next = nextWorkingHour(saturday, "Europe/London");
    expect(next.toISOString()).toBe("2026-09-28T08:00:00.000Z");
  });

  it("sends at once when quiet hours are off or it's a working hour", () => {
    const night = new Date("2026-09-23T02:00:00Z");
    expect(sendTime(night, false, "UTC")).toBeNull();
    expect(sendTime(new Date("2026-09-23T11:00:00Z"), true, "UTC")).toBeNull();
    expect(sendTime(night, true, "UTC")?.toISOString()).toBe("2026-09-23T09:00:00.000Z");
  });

  it("falls back to the server's zone for an unknown one", () => {
    expect(() => isWorkingHour(new Date(), "Not/AZone")).not.toThrow();
  });
});

describe("round health", () => {
  const createdAt = new Date("2026-09-01T00:00:00Z");
  const dueAt = new Date("2026-09-11T00:00:00Z");
  const round = { createdAt, dueAt, closedAt: null };

  it("is done when everyone finished", () => {
    expect(roundHealth(round, { people: 4, completed: 4 }, new Date("2026-09-20T00:00:00Z"))).toBe("done");
  });

  it("is overdue after the due date", () => {
    expect(roundHealth(round, { people: 4, completed: 1 }, new Date("2026-09-12T00:00:00Z"))).toBe("overdue");
  });

  it("is at risk when time runs out faster than people finish", () => {
    expect(roundHealth(round, { people: 10, completed: 1 }, new Date("2026-09-09T00:00:00Z"))).toBe("atRisk");
    expect(roundHealth(round, { people: 10, completed: 8 }, new Date("2026-09-09T00:00:00Z"))).toBe("onTrack");
  });

  it("is on track early on or without a due date", () => {
    expect(roundHealth(round, { people: 10, completed: 0 }, new Date("2026-09-02T00:00:00Z"))).toBe("onTrack");
    expect(roundHealth({ ...round, dueAt: null }, { people: 10, completed: 0 })).toBe("onTrack");
  });
});

describe("lifecycle rounds", () => {
  it("starts a set number of days after the start date, once", () => {
    expect(lifecycleDue("startDate", 30, "2026-08-25", new Date("2026-09-26T12:00:00Z"))).toEqual({
      due: new Date("2026-09-24T00:00:00Z"),
      cycle: 0,
    });
    expect(lifecycleDue("startDate", 30, "2026-09-20", new Date("2026-09-26T12:00:00Z"))).toBeNull();
  });

  it("leaves people who started long before the rule existed alone", () => {
    expect(lifecycleDue("startDate", 30, "2025-01-10", new Date("2026-09-26T12:00:00Z"))).toBeNull();
  });

  it("repeats on work anniversaries, not in the first year", () => {
    expect(lifecycleDue("anniversary", 0, "2024-09-23", new Date("2026-09-26T12:00:00Z"))).toEqual({
      due: new Date("2026-09-23T00:00:00Z"),
      cycle: 2026,
    });
    expect(lifecycleDue("anniversary", 0, "2026-09-23", new Date("2026-09-26T12:00:00Z"))).toBeNull();
    expect(lifecycleDue("anniversary", 0, "not a date", new Date())).toBeNull();
  });
});
