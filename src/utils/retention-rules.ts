// Retention periods an organization can choose, in months; 0 keeps data until it is deleted by hand.
export const RETENTION_OPTIONS = [0, 6, 12, 24, 36, 60] as const;
export const CANDIDATE_RETENTION_OPTIONS = [0, 3, 6, 12] as const;

// The moment before which data is removed, or null when the period is "keep".
export function retentionCutoff(now: Date, months: number): Date | null {
  if (months <= 0) return null;
  const cutoff = new Date(now);
  const day = cutoff.getDate();
  cutoff.setMonth(cutoff.getMonth() - months);
  // 31 March − 1 month lands on 3 March; step back to the last day of February.
  if (cutoff.getDate() < day) cutoff.setDate(0);
  return cutoff;
}
