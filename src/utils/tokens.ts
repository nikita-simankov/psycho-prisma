import "server-only";

import { createHash, randomBytes } from "crypto";

// Tokens for invitation and password reset links. Only the hash is stored.
export function createToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashToken(token) };
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
