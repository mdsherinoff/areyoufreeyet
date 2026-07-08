"use client";

import { BusyEvent } from "@/types";
import { formatTimeStr } from "@/lib/time";
import { convertEventDaysFromUTC } from "@/lib/timezone";
import { IconClose } from "./Icons";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface EventListProps {
  /** Timezone the stored (UTC) events are displayed in. */
  timezone: string;
  events: BusyEvent[];
  onRemove: (eventId: string) => void;
}

export function EventList({ timezone, events, onRemove }: EventListProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-6 text-text-3 text-sm">
        No events added yet — all free!
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {events.map((ev) => {
        const display = convertEventDaysFromUTC(
          ev.days,
          ev.startTime,
          ev.endTime,
          timezone,
        );
        return (
          <div
            key={ev.id}
            className="flex items-center gap-3 border border-border rounded-control px-3.5 py-2.5 bg-surface hover:border-border-mid transition-colors"
          >
            <div
              className={`w-2 h-2 rounded-full shrink-0 ${
                ev.type === "recurring" ? "bg-maroon" : "bg-amber"
              }`}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{ev.title}</div>
              <div className="text-xs text-text-2">
                {display.days.map((d) => DAYS[d]).join(", ")} ·{" "}
                {formatTimeStr(display.startTime)} –{" "}
                {formatTimeStr(display.endTime)}
              </div>
            </div>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                ev.type === "recurring"
                  ? "bg-maroon-light text-maroon-dark"
                  : "bg-amber-light text-amber"
              }`}
            >
              {ev.type === "recurring" ? "Weekly" : "One-off"}
            </span>
            <button
              type="button"
              onClick={() => onRemove(ev.id)}
              className="text-text-3 hover:text-red hover:bg-red-light rounded-md p-1 -mr-1 transition-colors shrink-0"
              title="Remove"
            >
              <IconClose width={15} height={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
