import { runMaintenance } from "./rounds";

const HOUR = 60 * 60_000;

async function tick() {
  try {
    const result = await runMaintenance();
    if (result.schedules || result.reminders || result.invitations) {
      console.info("[scheduler]", result);
    }
  } catch (error) {
    console.error("[scheduler] failed", error);
  }
}

export function startScheduler() {
  // Shortly after start, then every hour.
  setTimeout(tick, 60_000).unref();
  setInterval(tick, HOUR).unref();
}
