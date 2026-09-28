import "server-only";

import { headers } from "next/headers";
import { clientIpFrom, trustedProxyCount } from "./client-ip";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const SWEEP_EVERY = 1000;
let calls = 0;

// Fixed-window limiter kept in process memory. Good enough for a single server;
// swap for a shared store (Redis, database) once the app runs on several instances.
export function consumeRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();

  // Drop expired windows now and then, so keys seen once don't stay in memory forever.
  if (++calls % SWEEP_EVERY === 0) {
    for (const [stale, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(stale);
    }
  }

  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) {
    return false;
  }

  bucket.count += 1;
  return true;
}

// The caller's address for rate limit keys ("local" when no proxy reports one).
export async function requestIp() {
  const list = await headers();
  return clientIpFrom(list.get("x-forwarded-for"), trustedProxyCount()) ?? list.get("x-real-ip") ?? "local";
}
