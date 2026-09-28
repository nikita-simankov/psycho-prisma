import { runMaintenance, type MaintenanceResult } from "./rounds";

const HOUR = 60 * 60_000;

// Whether a run did anything worth a log line: a failed step or a step that counted work.
function worthLogging({ failed, ...steps }: MaintenanceResult) {
  const counts = Object.values(steps).flatMap((value) => (typeof value === "object" && value ? Object.values(value) : [value]));
  return failed.length > 0 || counts.some((count) => typeof count === "number" && count > 0);
}

async function tick() {
  try {
    const result = await runMaintenance();
    if (worthLogging(result)) {
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
