// Working hours for round emails: Monday to Friday, 9:00 to 18:00 in the person's time zone.

const HOUR = 60 * 60_000;
export const WORK_START = 9;
export const WORK_END = 18;

export function isTimeZone(value: string | null | undefined): value is string {
  if (!value) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

// The weekday (0 = Sunday) and hour at this moment in the time zone.
export function localTime(date: Date, timeZone?: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: isTimeZone(timeZone) ? timeZone : undefined,
    weekday: "short",
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.find((part) => part.type === "weekday")!.value);
  const hour = Number(parts.find((part) => part.type === "hour")!.value);
  return { weekday, hour };
}

export function isWorkingHour(date: Date, timeZone?: string) {
  const { weekday, hour } = localTime(date, timeZone);
  return weekday >= 1 && weekday <= 5 && hour >= WORK_START && hour < WORK_END;
}

// The next moment inside working hours, to the hour. The hourly job sends anything due by then.
export function nextWorkingHour(date: Date, timeZone?: string) {
  const start = new Date(Math.floor(date.getTime() / HOUR) * HOUR);
  for (let step = 1; step <= 24 * 8; step++) {
    const candidate = new Date(start.getTime() + step * HOUR);
    if (isWorkingHour(candidate, timeZone)) {
      return candidate;
    }
  }
  return date;
}

// When an email to this person should go out: now, or the start of their next working hour.
export function sendTime(now: Date, quiet: boolean, timeZone: string | undefined) {
  return !quiet || isWorkingHour(now, timeZone) ? null : nextWorkingHour(now, timeZone);
}
