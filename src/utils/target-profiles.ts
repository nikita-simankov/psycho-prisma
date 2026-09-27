import { normPosition, type NormScale } from "./norms";
import type { ScaleRow } from "./scoring";

// A target profile gives some of a test's scales the range a role calls for, on the test's own
// norm scale: stens 1–10 or T-scores 20–80. Tests scored only as raw points have no targets.
export type TargetBand = {
  scaleId: number;
  min: number;
  max: number;
  // The organization's own interview questions for a score below or above the range, one per line.
  low?: string;
  high?: string;
};

export const TARGET_LIMITS: Record<NormScale, { min: number; max: number }> = {
  sten: { min: 1, max: 10 },
  t: { min: 20, max: 80 },
};

// How many results the compare view puts side by side.
export const COMPARE_MIN = 2;
export const COMPARE_MAX = 4;

// The norm scale a test's targets are set on, or null when its results have no norm score.
export function targetKind(strategy: string): NormScale | null {
  return strategy === "standard-ten" ? "sten" : strategy === "t-grade" ? "t" : null;
}

// Stored bands, dropping anything malformed so an odd row never breaks a results page.
export function parseTargetBands(value: string): TargetBand[] {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((band) =>
      band && Number.isInteger(band.scaleId) && Number.isFinite(band.min) && Number.isFinite(band.max) && band.min <= band.max
        ? [
            {
              scaleId: band.scaleId,
              min: band.min,
              max: band.max,
              low: typeof band.low === "string" ? band.low : "",
              high: typeof band.high === "string" ? band.high : "",
            },
          ]
        : []
    );
  } catch {
    return [];
  }
}

export type FitStatus = "inside" | "below" | "above" | "missing";

export type ScaleFit = { scaleId: number; scaleName: string; value: number | null; band: TargetBand; status: FitStatus };

export type ProfileFit = {
  scales: ScaleFit[];
  // Scales inside their range, out of the targeted scales that have a norm score.
  inside: number;
  total: number;
  // strong: at least four in five inside; partial: at least half; weak: fewer; none: nothing to compare.
  level: "strong" | "partial" | "weak" | "none";
};

// Where one score sits against its target range.
export function fitStatus(row: Pick<ScaleRow, "stan" | "tGrade"> | undefined, band: Pick<TargetBand, "min" | "max">): FitStatus {
  const position = row ? normPosition(row) : null;
  if (!position) return "missing";
  return position.value < band.min ? "below" : position.value > band.max ? "above" : "inside";
}

// How a result fits a target profile: each targeted scale's status and the count inside.
export function profileFit(rows: ScaleRow[], bands: TargetBand[]): ProfileFit {
  const byScale = new Map(rows.map((row) => [row.scaleId, row]));
  const scales = bands.flatMap((band): ScaleFit[] => {
    const row = byScale.get(band.scaleId);
    // A scale the result doesn't have (an older version of the test) is left out.
    if (!row) return [];
    return [{ scaleId: band.scaleId, scaleName: row.scaleName, value: normPosition(row)?.value ?? null, band, status: fitStatus(row, band) }];
  });
  const total = scales.filter((scale) => scale.status !== "missing").length;
  const inside = scales.filter((scale) => scale.status === "inside").length;
  const level = total === 0 ? "none" : inside / total >= 0.8 ? "strong" : inside / total >= 0.5 ? "partial" : "weak";
  return { scales, inside, total, level };
}

// Target bands keyed by scale, for drawing them on each scale's track.
export function bandsByScale(bands: TargetBand[] | undefined): Map<number, TargetBand> {
  return new Map((bands ?? []).map((band) => [band.scaleId, band]));
}
