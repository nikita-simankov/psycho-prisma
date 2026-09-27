import { randomBytes, randomInt, scryptSync, timingSafeEqual } from "crypto";

// Rules for report share links (the ReportShare model): how long they last, the 6-digit access
// code and how many wrong codes lock a link. Only hashes of the link's token and of the code are
// stored, so neither can be read back; the sharer passes both on when the link is made.

export const SHARE_MIN_DAYS = 1;
export const SHARE_MAX_DAYS = 30;
export const SHARE_DEFAULT_DAYS = 7;
// Every CODE_ATTEMPTS wrong codes lock the link for LOCK_MINUTES; after CODE_LIMIT wrong codes in
// all it stays locked until it expires, so nobody can work through the million codes.
export const CODE_ATTEMPTS = 5;
export const LOCK_MINUTES = 15;
export const CODE_LIMIT = 20;
// How long a correct code keeps the link open in the recipient's browser. The cookie holds the
// code, scoped to the link's own path, and is checked like a typed code on every view.
export const ACCESS_HOURS = 12;
export const SHARE_COOKIE = "report_share";

const DAY = 86_400_000;
const CODE = /^\d{6}$/;

export function shareExpiry(days: number, now = new Date()) {
  const clamped = Math.min(SHARE_MAX_DAYS, Math.max(SHARE_MIN_DAYS, Math.round(days)));
  return new Date(now.getTime() + clamped * DAY);
}

export function createAccessCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

// People type codes with spaces or dashes ("123 456"); only the digits count.
export function normalizeCode(input: string) {
  return input.replace(/[\s-]/g, "");
}

// Salted scrypt, so a copied database doesn't hand over the codes by a simple lookup.
export function hashAccessCode(code: string, salt = randomBytes(16).toString("hex")) {
  return `${salt}:${scryptSync(code, salt, 32).toString("hex")}`;
}

export function verifyAccessCode(code: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash || !CODE.test(code)) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(code, salt, 32);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

type ShareLike = { expiresAt: Date; revokedAt: Date | null; lockedUntil: Date | null; failedAttempts: number; codeHash: string };

export type ShareState = "active" | "expired" | "revoked" | "locked";

export function shareState(share: Omit<ShareLike, "codeHash" | "failedAttempts">, now = new Date()): ShareState {
  if (share.revokedAt) return "revoked";
  if (share.expiresAt <= now) return "expired";
  if (share.lockedUntil && share.lockedUntil > now) return "locked";
  return "active";
}

export type CodeCheck = {
  outcome: "ok" | "wrong" | "locked" | "expired" | "revoked";
  // What to store on the link, or null when nothing changes.
  update: { failedAttempts: number; lockedUntil: Date | null } | null;
};

// Checks a code against a link and says what to store. A wrong code adds to the link's count,
// which locks it at every CODE_ATTEMPTS and for good at CODE_LIMIT; a right one changes nothing,
// so the recipient opening the link never gives someone guessing a fresh set of tries.
// A locked link refuses every code, the right one too, until the lock ends.
export function checkShareCode(share: ShareLike, code: string, now = new Date()): CodeCheck {
  const state = shareState(share, now);
  if (state !== "active") return { outcome: state, update: null };

  if (verifyAccessCode(normalizeCode(code), share.codeHash)) {
    return { outcome: "ok", update: null };
  }

  const failedAttempts = share.failedAttempts + 1;
  if (failedAttempts >= CODE_LIMIT) {
    return { outcome: "locked", update: { failedAttempts, lockedUntil: share.expiresAt } };
  }
  return failedAttempts % CODE_ATTEMPTS === 0
    ? { outcome: "locked", update: { failedAttempts, lockedUntil: new Date(now.getTime() + LOCK_MINUTES * 60_000) } }
    : { outcome: "wrong", update: { failedAttempts, lockedUntil: null } };
}
