// Checks the settings, then starts the hourly job that opens scheduled rounds, sends reminders
// and removes expired invitations. Set DISABLE_SCHEDULER=1 when an external cron calls /api/cron instead.
export async function register() {
  // Written this way so the edge build drops the import (it needs Node's crypto).
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { environmentProblems } = await import("./utils/environment");
    const { errors, warnings } = environmentProblems(process.env);
    for (const warning of warnings) console.warn(`[config] ${warning}`);
    for (const error of errors) console.error(`[config] ${error}`);
    if (errors.length && process.env.NODE_ENV === "production") {
      throw new Error("Invalid configuration; see the [config] lines above.");
    }

    if (process.env.DISABLE_SCHEDULER !== "1") {
      const { startScheduler } = await import("./utils/scheduler");
      startScheduler();
    }
  }
}

type RequestErrorContext = { routePath: string; routeType: string };

// Every server error, as one JSON line with the reference shown on the error page, so a
// reported reference can be found in the logs. The route's pattern is logged instead of the
// path, which can hold a sign-in or share token. ERROR_WEBHOOK_URL also receives each report.
export async function onRequestError(error: unknown, request: { method: string }, context: RequestErrorContext) {
  const report = {
    level: "error",
    message: error instanceof Error ? error.message : String(error),
    digest: typeof error === "object" && error !== null && "digest" in error ? String(error.digest) : undefined,
    route: context.routePath,
    routeType: context.routeType,
    method: request.method,
    at: new Date().toISOString(),
  };
  console.error(JSON.stringify(report));

  if (process.env.ERROR_WEBHOOK_URL) {
    await fetch(process.env.ERROR_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...report, text: `Calibre ${report.routeType} error on ${report.route}: ${report.message}` }),
      signal: AbortSignal.timeout(5_000),
    }).catch(() => {});
  }
}
