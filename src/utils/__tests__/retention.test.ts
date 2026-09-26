import { describe, expect, it } from "vitest";
import { retentionCutoff } from "../retention-rules";

describe("retentionCutoff", () => {
  it("keeps everything for 0 months", () => {
    expect(retentionCutoff(new Date("2026-09-26T10:00:00"), 0)).toBeNull();
  });

  it("goes back whole months", () => {
    expect(retentionCutoff(new Date("2026-09-26T10:00:00"), 12)?.toISOString()).toBe(new Date("2025-09-26T10:00:00").toISOString());
  });

  it("stops at the end of shorter months", () => {
    expect(retentionCutoff(new Date("2026-03-31T10:00:00"), 1)?.getDate()).toBe(28);
  });
});
