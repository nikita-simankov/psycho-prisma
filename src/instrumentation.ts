// Starts the hourly job that opens scheduled rounds, sends reminders and removes expired
// invitations. Set DISABLE_SCHEDULER=1 when an external cron calls /api/cron instead.
export async function register() {
  // Written this way so the edge build drops the import (it needs Node's crypto).
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (process.env.DISABLE_SCHEDULER !== "1") {
      const { startScheduler } = await import("./utils/scheduler");
      startScheduler();
    }
  }
}
