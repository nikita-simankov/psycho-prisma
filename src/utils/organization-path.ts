import "server-only";

import { headers } from "next/headers";
import { ORGANIZATION_HEADER } from "./constants";

// "/acme" for the organization in the current URL, set by the middleware.
export function organizationBase() {
  return `/${headers().get(ORGANIZATION_HEADER) ?? ""}`;
}
