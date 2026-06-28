import { fromZonedTime, toZonedTime } from "date-fns-tz";

/**
 * Detects the browser's IANA timezone (e.g. "America/New_York").
 * Falls back to UTC if detection fails for any reason.
 */
export function detectBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/**
 * Convert a "wall clock" time (as entered by a user, e.g. "09:00" on a given
 * reference date) in a given timezone into UTC minutes-since-midnight.
 *
 * We need a reference date because timezone offsets can change across the
 * year (daylight saving). We use a fixed reference date matching the actual
 * event's day where possible; for recurring weekly events without a specific
 * date, "today" is a reasonable approximation.
 */
export function wallTimeToUTCMinutes(
  timeStr: string,
  timezone: string,
  referenceDate: Date = new Date(),
): number {
  const [h, m] = timeStr.split(":").map(Number);
  const naive = new Date(referenceDate);
  naive.setHours(h, m, 0, 0);

  const utcInstant = fromZonedTime(naive, timezone);
  return utcInstant.getUTCHours() * 60 + utcInstant.getUTCMinutes();
}

/**
 * Convert UTC minutes-since-midnight back into a wall-clock "HH:MM" string
 * in the given display timezone.
 */
export function utcMinutesToWallTime(
  utcMinutes: number,
  timezone: string,
  referenceDate: Date = new Date(),
): string {
  const utcInstant = new Date(referenceDate);
  utcInstant.setUTCHours(Math.floor(utcMinutes / 60), utcMinutes % 60, 0, 0);

  const zoned = toZonedTime(utcInstant, timezone);
  const hh = String(zoned.getHours()).padStart(2, "0");
  const mm = String(zoned.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** A small curated list of common timezones for the selector dropdown. */
export const COMMON_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Moscow",
  "Africa/Cairo",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Dhaka",
  "Asia/Bangkok",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Sydney",
  "Pacific/Auckland",
];

/**
 * Convert an event's days[] + wall-clock startTime/endTime (in a given
 * display timezone) into UTC. Because timezone conversion can shift which
 * calendar day an instant falls on, each input day is converted
 * independently and may map to a different UTC day.
 *
 * Returns one or more {day, startTime, endTime} segments in UTC. Multiple
 * input days can collapse to fewer output entries if conversion makes them
 * land on the same UTC day with the same times (we don't bother
 * deduplicating here -- the caller stores them as separate days, which is
 * harmless since matching duplicate slots is a no-op for the busy matrix).
 */
export function convertEventDaysToUTC(
  days: number[],
  startTime: string,
  endTime: string,
  timezone: string,
): { days: number[]; startTime: string; endTime: string } {
  // Use a fixed reference Monday. Only relevant for DST-boundary precision;
  // for the vast majority of timezones/dates this has no effect on the
  // resulting offset.
  const ANCHOR_MONDAY = new Date("2026-06-29T00:00:00");

  const utcDaySet = new Set<number>();
  let utcStartTime = startTime;
  let utcEndTime = endTime;

  for (const day of days) {
    const dayDate = new Date(ANCHOR_MONDAY);
    dayDate.setDate(ANCHOR_MONDAY.getDate() + day);

    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);

    const startNaive = new Date(dayDate);
    startNaive.setHours(sh, sm, 0, 0);
    const endNaive = new Date(dayDate);
    endNaive.setHours(eh, em, 0, 0);

    const startUTC = fromZonedTime(startNaive, timezone);
    const endUTC = fromZonedTime(endNaive, timezone);

    const utcDay = (startUTC.getUTCDay() + 6) % 7; // convert Sun=0 -> Mon=0 model
    utcDaySet.add(utcDay);

    // All days in a single event share the same time-of-day conversion
    // (same timezone, same wall-clock times), so start/end only need
    // computing once -- we just keep recomputing it here for clarity and
    // because it's cheap; the values will be identical each loop iteration
    // except potentially across a DST boundary affecting different dates.
    utcStartTime = `${String(startUTC.getUTCHours()).padStart(2, "0")}:${String(startUTC.getUTCMinutes()).padStart(2, "0")}`;
    utcEndTime = `${String(endUTC.getUTCHours()).padStart(2, "0")}:${String(endUTC.getUTCMinutes()).padStart(2, "0")}`;
  }

  return {
    days: Array.from(utcDaySet).sort(),
    startTime: utcStartTime,
    endTime: utcEndTime,
  };
}

/**
 * The reverse of convertEventDaysToUTC: given UTC days/startTime/endTime,
 * convert back into wall-clock days/times for a given display timezone.
 * Used when showing stored (UTC) events to the user.
 */
export function convertEventDaysFromUTC(
  days: number[],
  startTime: string,
  endTime: string,
  timezone: string,
): { days: number[]; startTime: string; endTime: string } {
  const ANCHOR_MONDAY_UTC = new Date("2026-06-29T00:00:00Z");

  const displayDaySet = new Set<number>();
  let displayStartTime = startTime;
  let displayEndTime = endTime;

  for (const day of days) {
    const dayDateUTC = new Date(ANCHOR_MONDAY_UTC);
    dayDateUTC.setUTCDate(ANCHOR_MONDAY_UTC.getUTCDate() + day);

    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);

    const startUTC = new Date(dayDateUTC);
    startUTC.setUTCHours(sh, sm, 0, 0);
    const endUTC = new Date(dayDateUTC);
    endUTC.setUTCHours(eh, em, 0, 0);

    const startZoned = toZonedTime(startUTC, timezone);
    const endZoned = toZonedTime(endUTC, timezone);

    const displayDay = (startZoned.getDay() + 6) % 7;
    displayDaySet.add(displayDay);

    displayStartTime = `${String(startZoned.getHours()).padStart(2, "0")}:${String(startZoned.getMinutes()).padStart(2, "0")}`;
    displayEndTime = `${String(endZoned.getHours()).padStart(2, "0")}:${String(endZoned.getMinutes()).padStart(2, "0")}`;
  }

  return {
    days: Array.from(displayDaySet).sort(),
    startTime: displayStartTime,
    endTime: displayEndTime,
  };
}