type Env = Record<string, string | undefined>;

// Settings that come in groups: setting part of a group is almost always a mistake.
const GROUPS: [string, string[]][] = [
  ["Paddle billing", ["PADDLE_API_KEY", "PADDLE_WEBHOOK_SECRET", "PADDLE_PRICE_TEAM", "PADDLE_PRICE_BUSINESS"]],
  ["Google sign-in", ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"]],
  ["Microsoft sign-in", ["MICROSOFT_CLIENT_ID", "MICROSOFT_CLIENT_SECRET"]],
];

// Checked when the server starts. Errors stop a production server from starting;
// warnings are logged. See the variables table in README.md.
export function environmentProblems(env: Env) {
  const production = env.NODE_ENV === "production";
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!env.DATABASE_URL) {
    errors.push("DATABASE_URL is not set.");
  }

  if (env.APP_URL) {
    let url: URL | null = null;
    try {
      url = new URL(env.APP_URL);
    } catch {}
    if (!url || !["http:", "https:"].includes(url.protocol)) {
      errors.push(`APP_URL is not an http(s) address: "${env.APP_URL}".`);
    } else if (production && url.protocol === "http:" && url.hostname !== "localhost") {
      warnings.push("APP_URL uses http: session cookies are only sent over https in production.");
    }
  } else if (production) {
    // Links in emails would otherwise come from the request's Host header, which the sender controls.
    errors.push("APP_URL is not set. Links in password reset and invitation emails need the public address.");
  }

  if (production && !env.RESEND_API_KEY) {
    warnings.push("RESEND_API_KEY is not set: no email is sent (invitations, password resets, reminders).");
  }

  if (env.DISABLE_SCHEDULER === "1" && !env.CRON_SECRET) {
    warnings.push("DISABLE_SCHEDULER=1 without CRON_SECRET: nothing can run the hourly job (rounds, reminders, retention).");
  }

  for (const [name, keys] of GROUPS) {
    const set = keys.filter((key) => env[key]);
    if (set.length && set.length < keys.length) {
      warnings.push(`${name} is partly configured; missing ${keys.filter((key) => !env[key]).join(", ")}.`);
    }
  }

  return { errors, warnings };
}
