// Calibre's plans. The marketing site reads these now; billing (Paddle) and entitlement checks
// will read the same table. Prices are the proposals from the plan and are not final yet.

export type PlanId = "free" | "team" | "business" | "enterprise";

export type Plan = {
  id: PlanId;
  // Per month, billed yearly, in PLAN_CURRENCY. Null means priced on request.
  monthlyPrice: number | null;
  // Unique people who submit at least one assessment in a billing year. Null means unlimited.
  respondentsPerYear: number | null;
  // Staff seats (owners, admins, psychologists, HR). Respondents never use a seat. Null means unlimited.
  staffSeats: number | null;
  trialDays?: number;
};

export const PLAN_CURRENCY = "EUR";

export const PLANS: Plan[] = [
  { id: "free", monthlyPrice: 0, respondentsPerYear: 25, staffSeats: 2 },
  { id: "team", monthlyPrice: 89, respondentsPerYear: 250, staffSeats: 5 },
  { id: "business", monthlyPrice: 290, respondentsPerYear: 1500, staffSeats: 15, trialDays: 14 },
  { id: "enterprise", monthlyPrice: null, respondentsPerYear: null, staffSeats: null },
];

// The plan new workspaces try for free, and the one the pricing page highlights.
export const TRIAL_PLAN: PlanId = "business";

// What each plan unlocks. true/false, or a word naming a partial level (a key under pricing.levels).
export type FeatureLevel = boolean | "basic" | "copy" | "logo" | "full";

export const PLAN_FEATURES = [
  { key: "library", levels: { free: true, team: true, business: true, enterprise: true } },
  { key: "reports", levels: { free: true, team: true, business: true, enterprise: true } },
  { key: "schedules", levels: { free: false, team: true, business: true, enterprise: true } },
  { key: "export", levels: { free: false, team: true, business: true, enterprise: true } },
  { key: "analytics", levels: { free: false, team: "basic", business: true, enterprise: true } },
  { key: "studio", levels: { free: false, team: "copy", business: true, enterprise: true } },
  { key: "clinical", levels: { free: false, team: false, business: true, enterprise: true } },
  { key: "audit", levels: { free: false, team: false, business: true, enterprise: true } },
  { key: "branding", levels: { free: false, team: false, business: "logo", enterprise: "full" } },
  { key: "sso", levels: { free: false, team: false, business: false, enterprise: true } },
  { key: "invoicing", levels: { free: false, team: false, business: false, enterprise: true } },
] as const satisfies readonly { key: string; levels: Record<PlanId, FeatureLevel> }[];
