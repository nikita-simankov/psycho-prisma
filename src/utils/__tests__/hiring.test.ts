import { describe, expect, it } from "vitest";
import { selectStrengths } from "../candidate-feedback";
import { interviewTopics } from "../interview-guide";
import type { ScaleRow } from "../scoring";
import {
  checkShareCode,
  CODE_ATTEMPTS,
  CODE_LIMIT,
  createAccessCode,
  hashAccessCode,
  LOCK_MINUTES,
  normalizeCode,
  shareExpiry,
  shareState,
  verifyAccessCode,
} from "../share-links";
import { fitStatus, parseTargetBands, profileFit, targetKind } from "../target-profiles";

const sten = (scaleId: number, scaleName: string, stan: number | null): ScaleRow => ({
  scaleId,
  scaleName,
  rawGrade: 10,
  correctedGrade: null,
  tGrade: null,
  stan,
  summary: null,
});
const tScore = (scaleId: number, scaleName: string, tGrade: number): ScaleRow => ({ ...sten(scaleId, scaleName, null), tGrade });

const NOW = new Date("2026-05-01T12:00:00Z");

describe("target profiles", () => {
  it("sets targets only on tests with a norm scale", () => {
    expect(targetKind("standard-ten")).toBe("sten");
    expect(targetKind("t-grade")).toBe("t");
    expect(targetKind("grade")).toBeNull();
  });

  it("reads a score below, inside and above its range, and a scale without norms as missing", () => {
    const band = { min: 5, max: 8 };
    expect(fitStatus(sten(1, "A", 4), band)).toBe("below");
    expect(fitStatus(sten(1, "A", 5), band)).toBe("inside");
    expect(fitStatus(sten(1, "A", 8), band)).toBe("inside");
    expect(fitStatus(sten(1, "A", 9), band)).toBe("above");
    expect(fitStatus(sten(1, "A", null), band)).toBe("missing");
    expect(fitStatus(tScore(1, "A", 95), { min: 60, max: 80 })).toBe("inside");
  });

  it("counts the scales inside and grades the fit", () => {
    const rows = [sten(1, "Drive", 7), sten(2, "Calm", 3), sten(3, "Care", 6), sten(4, "Order", 5), sten(5, "Raw", null)];
    const bands = [1, 2, 3, 4, 5].map((scaleId) => ({ scaleId, min: 5, max: 8 }));
    const fit = profileFit(rows, bands);
    expect(fit).toMatchObject({ inside: 3, total: 4, level: "partial" });
    expect(fit.scales.map((scale) => scale.status)).toEqual(["inside", "below", "inside", "inside", "missing"]);
    expect(profileFit(rows, [{ scaleId: 1, min: 5, max: 8 }]).level).toBe("strong");
    expect(profileFit(rows, [{ scaleId: 2, min: 5, max: 8 }]).level).toBe("weak");
    // Scales the result doesn't have are left out.
    expect(profileFit(rows, [{ scaleId: 99, min: 1, max: 2 }])).toMatchObject({ total: 0, level: "none", scales: [] });
  });

  it("drops malformed stored bands", () => {
    expect(parseTargetBands("not json")).toEqual([]);
    expect(parseTargetBands(JSON.stringify([{ scaleId: 1, min: 7, max: 3 }, { scaleId: "x", min: 1, max: 2 }, { scaleId: 2, min: 4, max: 6, low: "Why?" }]))).toEqual([
      { scaleId: 2, min: 4, max: 6, low: "Why?", high: "" },
    ]);
  });
});

describe("share links", () => {
  const share = (overrides: Partial<Parameters<typeof checkShareCode>[0]> = {}) => ({
    expiresAt: new Date(NOW.getTime() + 86_400_000),
    revokedAt: null,
    lockedUntil: null,
    failedAttempts: 0,
    codeHash: hashAccessCode("123456"),
    ...overrides,
  });

  it("expires after 1 to 30 days", () => {
    expect(shareExpiry(7, NOW).toISOString()).toBe("2026-05-08T12:00:00.000Z");
    expect(shareExpiry(0, NOW).toISOString()).toBe("2026-05-02T12:00:00.000Z");
    expect(shareExpiry(90, NOW).toISOString()).toBe("2026-05-31T12:00:00.000Z");
  });

  it("makes six-digit codes and stores only a salted hash", () => {
    const code = createAccessCode();
    expect(code).toMatch(/^\d{6}$/);
    const stored = hashAccessCode(code);
    expect(stored).not.toContain(code);
    expect(hashAccessCode(code)).not.toBe(stored);
    expect(verifyAccessCode(code, stored)).toBe(true);
    expect(verifyAccessCode("12345", stored)).toBe(false);
    expect(verifyAccessCode(code, "broken")).toBe(false);
    expect(normalizeCode(" 123 456 ")).toBe("123456");
  });

  it("tells active, expired, revoked and locked links apart", () => {
    expect(shareState(share(), NOW)).toBe("active");
    expect(shareState(share({ expiresAt: NOW }), NOW)).toBe("expired");
    expect(shareState(share({ revokedAt: NOW }), NOW)).toBe("revoked");
    expect(shareState(share({ lockedUntil: new Date(NOW.getTime() + 1000) }), NOW)).toBe("locked");
    expect(shareState(share({ lockedUntil: new Date(NOW.getTime() - 1000) }), NOW)).toBe("active");
  });

  it("accepts the right code, spaced or not, without clearing earlier mistakes", () => {
    expect(checkShareCode(share({ failedAttempts: 3 }), "123 456", NOW)).toEqual({ outcome: "ok", update: null });
  });

  it("counts wrong codes and locks the link at every fifth", () => {
    expect(checkShareCode(share(), "000000", NOW)).toEqual({ outcome: "wrong", update: { failedAttempts: 1, lockedUntil: null } });
    const locked = checkShareCode(share({ failedAttempts: CODE_ATTEMPTS - 1 }), "000000", NOW);
    expect(locked).toEqual({ outcome: "locked", update: { failedAttempts: CODE_ATTEMPTS, lockedUntil: new Date(NOW.getTime() + LOCK_MINUTES * 60_000) } });
    // While locked even the right code is refused, and nothing is written.
    expect(checkShareCode(share({ lockedUntil: locked.update!.lockedUntil }), "123456", NOW)).toEqual({ outcome: "locked", update: null });
  });

  it("locks for good after too many wrong codes", () => {
    const expiresAt = new Date(NOW.getTime() + 5 * 86_400_000);
    expect(checkShareCode(share({ expiresAt, failedAttempts: CODE_LIMIT - 1 }), "000000", NOW)).toEqual({
      outcome: "locked",
      update: { failedAttempts: CODE_LIMIT, lockedUntil: expiresAt },
    });
  });

  it("refuses codes on revoked and expired links without counting them", () => {
    expect(checkShareCode(share({ revokedAt: NOW }), "123456", NOW)).toEqual({ outcome: "revoked", update: null });
    expect(checkShareCode(share({ expiresAt: NOW }), "123456", NOW)).toEqual({ outcome: "expired", update: null });
  });
});

describe("candidate feedback", () => {
  it("names the highest scores above the middle, never low ones or scores", () => {
    const strengths = selectStrengths([
      { testName: "Personality", rows: [sten(1, "Drive", 9), sten(2, "Calm", 2), sten(3, "Care", 6), sten(4, "Order", 5), sten(5, "Raw", null)] },
      { testName: "Values", rows: [tScore(1, "Service", 68), tScore(2, "Status", 50)] },
    ]);
    expect(strengths).toEqual([
      { scaleId: 1, scaleName: "Drive", testName: "Personality", level: "marked" },
      { scaleId: 1, scaleName: "Service", testName: "Values", level: "marked" },
      { scaleId: 3, scaleName: "Care", testName: "Personality", level: "clear" },
    ]);
    expect(JSON.stringify(strengths)).not.toMatch(/"(stan|value|tGrade)"/);
  });

  it("keeps each scale once and stops at the limit", () => {
    const rows = [sten(1, "Drive", 8), sten(2, "Care", 7), sten(3, "Order", 10)];
    expect(selectStrengths([{ testName: "A", rows }, { testName: "B", rows: [sten(1, "drive", 9)] }], 2).map((s) => s.scaleName)).toEqual(["Order", "drive"]);
  });

  it("names nothing when every score is at or below the middle", () => {
    expect(selectStrengths([{ testName: "A", rows: [sten(1, "Drive", 5), sten(2, "Calm", 1), tScore(3, "X", 50)] }])).toEqual([]);
  });
});

describe("interview guide", () => {
  it("asks about scales outside the target first, then extremes, with the profile's own questions", () => {
    const rows = [sten(1, "Drive", 3), sten(2, "Calm", 10), sten(3, "Care", 6), sten(4, "Order", 1), sten(5, "Pace", 9)];
    const topics = interviewTopics(rows, [
      { scaleId: 1, min: 6, max: 9, low: "Tell me about a target you set yourself.\n\nWhat kept you going?" },
      { scaleId: 3, min: 4, max: 7 },
      { scaleId: 5, min: 4, max: 7 },
    ]);
    expect(topics.map((topic) => [topic.scaleName, topic.reason])).toEqual([
      ["Drive", "belowTarget"],
      ["Pace", "aboveTarget"],
      ["Calm", "extremeHigh"],
      ["Order", "extremeLow"],
    ]);
    expect(topics[0]).toMatchObject({ direction: "low", questions: ["Tell me about a target you set yourself.", "What kept you going?"] });
    // No questions of its own: the page falls back to the generic ones.
    expect(topics[1]).toMatchObject({ direction: "high", questions: [] });
  });

  it("uses the extremes of the scale without a profile, and skips scales without norms", () => {
    expect(interviewTopics([tScore(1, "Tension", 75), tScore(2, "Mood", 50), sten(3, "Raw", null)]).map((topic) => topic.reason)).toEqual(["extremeHigh"]);
    expect(interviewTopics([sten(1, "A", 5), sten(2, "B", 6)])).toEqual([]);
  });

  it("stops at the limit", () => {
    const rows = Array.from({ length: 10 }, (_, index) => sten(index, `S${index}`, 1));
    expect(interviewTopics(rows, [], 4)).toHaveLength(4);
  });
});
