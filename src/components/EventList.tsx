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
      <div className="border-t border-border py-6 text-center">
        <span className="eyebrow">No events yet — all free</span>
      </div>
    );
  }

  return (
    <div className="border-t border-border">
      {events.map((ev) => {
        const display = convertEventDaysFromUTC(
          ev.days,
          ev.startTime,
          ev.endTime,
          timezone,
        );
        const recurring = ev.type === "recurring";
        return (
          <div
            key={ev.id}
            className="group flex items-center gap-4 border-b border-border py-3"
          >
            <span
              className={`h-2.5 w-2.5 shrink-0 ${
                recurring ? "bg-maroon" : "bg-amber"
              }`}
              style={{ borderRadius: 1 }}
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{ev.title}</div>
              <div
                className={`eyebrow mt-0.5 ${
                  recurring ? "text-maroon" : "text-amber"
                }`}
              >
                {recurring ? "Weekly" : "One-off"}
              </div>
            </div>
            <div className="hidden font-mono text-[11px] uppercase tracking-[0.12em] text-text-2 sm:block">
              {display.days.map((d) => DAYS[d]).join(" ")}
            </div>
            <div className="w-[112px] shrink-0 text-right font-mono text-[13px] tabular-nums">
              {formatTimeStr(display.startTime)}–{formatTimeStr(display.endTime)}
            </div>
            <button
              type="button"
              onClick={() => onRemove(ev.id)}
              className="shrink-0 text-text-3 opacity-60 transition-all hover:text-red hover:opacity-100"
              title="Remove"
            >
              <IconClose width={16} height={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
