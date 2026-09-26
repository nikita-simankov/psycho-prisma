import "server-only";

import { headers } from "next/headers";
import { ORGANIZATION_HEADER } from "./constants";

// "/acme" for the organization in the current URL, set by the proxy (src/proxy.ts).
export async function organizationBase() {
  return `/${(await headers()).get(ORGANIZATION_HEADER) ?? ""}`;
}
