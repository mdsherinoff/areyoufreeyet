import ICAL from "ical.js";
import { BusyEvent } from "@/types";
import { createEvent } from "@/lib/factory";
import { minsToTime } from "@/lib/time";

const DAY_CODE_TO_INDEX: Record<string, number> = {
  MO: 0,
  TU: 1,
  WE: 2,
  TH: 3,
  FR: 4,
  SA: 5,
  SU: 6,
};

export interface ICSImportResult {
  events: BusyEvent[];
  skippedCount: number;
}

/**
 * Parse raw .ics file text into BusyEvent[], stored in UTC.
 * Best-effort: events that can't be parsed are skipped rather than
 * failing the whole import.
 */
export function parseICS(icsText: string): ICSImportResult {
  let comp: InstanceType<typeof ICAL.Component>;
  try {
    const jcalData = ICAL.parse(icsText);
    comp = new ICAL.Component(jcalData);
  } catch {
    return { events: [], skippedCount: 0 };
  }

  // Register any VTIMEZONE blocks so TZID-based times convert correctly.
  const vtimezones = comp.getAllSubcomponents("vtimezone");
  for (const vtz of vtimezones) {
    const tz = new ICAL.Timezone(vtz);
    if (tz.tzid) {
      ICAL.TimezoneService.register(tz.tzid, tz);
    }
  }

  const vevents = comp.getAllSubcomponents("vevent");
  const events: BusyEvent[] = [];
  let skippedCount = 0;

  for (const vevent of vevents) {
    try {
      const event = new ICAL.Event(vevent);
      const startDate = event.startDate.toJSDate();
      const endDate = event.endDate.toJSDate();

      const isRecurring = event.isRecurring();
      let days: number[];

      if (isRecurring) {
        const rrule = vevent.getFirstPropertyValue(
          "rrule",
        ) as ICAL.Recur | null;
        const frequency = rrule?.freq ?? null;

        if (frequency === "WEEKLY" && rrule?.parts?.BYDAY?.length) {
          days = (rrule.parts.BYDAY as string[])
            .map((code) => DAY_CODE_TO_INDEX[code])
            .filter((d) => d !== undefined);
        } else {
          // No BYDAY, or a non-WEEKLY frequency (DAILY/MONTHLY/etc).
          // Approximated as weekly on the event's own start day -- our
          // data model only supports "weekly on these days".
          days = [jsDayToMonFirst(startDate.getUTCDay())];
        }
      } else {
        days = [jsDayToMonFirst(startDate.getUTCDay())];
      }

      if (days.length === 0) {
        skippedCount++;
        continue;
      }

      const startTime = minsToTime(
        startDate.getUTCHours() * 60 + startDate.getUTCMinutes(),
      );
      const endTime = minsToTime(
        endDate.getUTCHours() * 60 + endDate.getUTCMinutes(),
      );

      events.push(
        createEvent({
          title: event.summary || "Busy",
          type: isRecurring ? "recurring" : "once",
          days,
          startTime,
          endTime,
        }),
      );
    } catch {
      skippedCount++;
    }
  }

  return { events, skippedCount };
}

// JS Date.getUTCDay(): 0=Sunday ... 6=Saturday. Our model: 0=Monday ... 6=Sunday.
function jsDayToMonFirst(jsDay: number): number {
  return (jsDay + 6) % 7;
}
