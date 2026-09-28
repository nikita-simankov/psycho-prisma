// The address a request came from, read from X-Forwarded-For. Each proxy appends the
// address it received the request from, so only the last `trustedProxies` entries were
// written by proxies we run; anything to their left is whatever the client sent and
// can't be used for rate limits. Railway and most hosts put one proxy in front.
export function clientIpFrom(forwardedFor: string | null, trustedProxies: number): string | null {
  if (!forwardedFor || trustedProxies < 1) return null;

  const entries = forwardedFor.split(",").map((entry) => entry.trim()).filter(Boolean);
  return entries[entries.length - trustedProxies] ?? entries[0] ?? null;
}

// TRUSTED_PROXY_COUNT: how many proxies sit in front of the app (default 1). 0 ignores the header.
export function trustedProxyCount(value = process.env.TRUSTED_PROXY_COUNT) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 1;
}
