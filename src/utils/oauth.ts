import "server-only";

import { createHash, randomBytes } from "crypto";

// Google and Microsoft sign-in (OpenID Connect, authorization code with PKCE). A provider is
// offered only when its client id and secret are set.

export const OAUTH_PROVIDERS = ["google", "microsoft"] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

// Holds the state and PKCE verifier between leaving for the provider and coming back.
export const OAUTH_COOKIE = "oauth_request";

export type OAuthProfile = {
  id: string;
  email: string;
  // Whether the provider vouches that the person controls this address. Only then is an
  // existing account with the same email linked automatically.
  emailVerified: boolean;
  name: string;
  lastName: string;
};

type Config = {
  clientId: string;
  clientSecret: string;
  authorizeUrl: string;
  tokenUrl: string;
  scope: string;
};

function config(provider: OAuthProvider): Config | null {
  if (provider === "google") {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    return clientId && clientSecret
      ? {
          clientId,
          clientSecret,
          authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
          tokenUrl: "https://oauth2.googleapis.com/token",
          scope: "openid email profile",
        }
      : null;
  }

  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  // "common" allows work, school and personal accounts; a tenant id limits it to one company.
  const tenant = process.env.MICROSOFT_TENANT || "common";
  return clientId && clientSecret
    ? {
        clientId,
        clientSecret,
        authorizeUrl: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`,
        tokenUrl: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
        scope: "openid email profile User.Read",
      }
    : null;
}

export function isOAuthProvider(value: string): value is OAuthProvider {
  return (OAUTH_PROVIDERS as readonly string[]).includes(value);
}

export function enabledProviders(): OAuthProvider[] {
  return OAUTH_PROVIDERS.filter((provider) => config(provider) !== null);
}

export function oauthCallbackUrl(origin: string, provider: OAuthProvider) {
  return `${process.env.APP_URL ?? origin}/auth/oauth/${provider}/callback`;
}

// The URL to send the browser to, and the state and verifier to keep in a cookie until it returns.
export function authorizationRequest(provider: OAuthProvider, redirectUri: string) {
  const settings = config(provider);
  if (!settings) {
    return null;
  }
  const state = randomBytes(24).toString("base64url");
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");

  const url = new URL(settings.authorizeUrl);
  url.search = new URLSearchParams({
    client_id: settings.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: settings.scope,
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();

  return { url: url.toString(), state, verifier };
}

// The id token comes straight from the provider's token endpoint over TLS, so its claims can be
// read without checking the signature (OpenID Connect Core 3.1.3.7).
function claims(idToken: string): Record<string, unknown> {
  const payload = idToken.split(".")[1];
  return payload ? JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) : {};
}

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

// Exchanges the code for tokens and reads who signed in.
export async function fetchProfile(provider: OAuthProvider, code: string, verifier: string, redirectUri: string): Promise<OAuthProfile | null> {
  const settings = config(provider);
  if (!settings) {
    return null;
  }

  const response = await fetch(settings.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: settings.clientId,
      client_secret: settings.clientSecret,
      code_verifier: verifier,
    }),
  });
  if (!response.ok) {
    return null;
  }
  const tokens = (await response.json()) as { id_token?: string };
  if (!tokens.id_token) {
    return null;
  }
  const idClaims = claims(tokens.id_token);
  if (idClaims.aud !== settings.clientId) {
    return null;
  }

  if (provider === "google") {
    const email = text(idClaims.email).toLowerCase();
    return email
      ? {
          id: text(idClaims.sub),
          email,
          emailVerified: idClaims.email_verified === true,
          name: text(idClaims.given_name) || text(idClaims.name),
          lastName: text(idClaims.family_name),
        }
      : null;
  }

  // Microsoft doesn't promise that the email claim was verified, unless the directory says so
  // with xms_edov, so an existing account is only linked when the person signs in to it first.
  const email = (text(idClaims.email) || text(idClaims.preferred_username)).toLowerCase();
  const [first, ...rest] = text(idClaims.name).split(" ");
  return email.includes("@")
    ? {
        // "oid" with "tid" identifies the person across apps; "sub" is per app and also stable.
        id: text(idClaims.oid) ? `${text(idClaims.tid)}:${text(idClaims.oid)}` : text(idClaims.sub),
        email,
        emailVerified: idClaims.xms_edov === true || idClaims.xms_edov === "1",
        name: text(idClaims.given_name) || first || "",
        lastName: text(idClaims.family_name) || rest.join(" "),
      }
    : null;
}

// Only paths on this site, never another host.
export function safeNext(next: string | null | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : null;
}
