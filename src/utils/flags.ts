// Restricted follow-up flags a psychologist can put on a person. Stored in Membership.flag
// ("" means none); labels live in the translation files under "flags".
export const FLAGS = ["monitoring", "risk", "suicide-risk", "substance-risk"] as const;

export type Flag = (typeof FLAGS)[number];

export function isFlag(value: string): value is Flag {
  return (FLAGS as readonly string[]).includes(value);
}

// Badge and dot colours per flag, from calm to urgent.
export const FLAG_STYLES: Record<Flag, { badge: string; dot: string }> = {
  monitoring: { badge: "bg-accent text-accent-foreground", dot: "bg-primary" },
  risk: { badge: "bg-warning/15 text-warning", dot: "bg-warning" },
  "substance-risk": { badge: "bg-warning/15 text-warning", dot: "bg-warning" },
  "suicide-risk": { badge: "bg-destructive/15 text-destructive", dot: "bg-destructive" },
};
