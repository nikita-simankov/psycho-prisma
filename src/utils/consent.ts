import { AuthorizationError } from "./authentication";
import { can } from "./roles";

// Respondents may only give answers while they agree to the organization's privacy notice.
// Staff agree when they create or join the organization and are not asked again.
export function assertConsented(membership: { role: string; consentedAt: Date | null }) {
  if (!can(membership.role, "viewDashboard") && !membership.consentedAt) {
    throw new AuthorizationError("Consent required");
  }
}
