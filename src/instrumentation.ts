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
