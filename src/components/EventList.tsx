"use client";

import { useMemo } from "react";
import { BusyEvent } from "@/types";
import { formatTimeStr, timeToMins } from "@/lib/time";
import { convertEventDaysFromUTC } from "@/lib/timezone";
import { IconClose } from "./Icons";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface EventListProps {
  /** Timezone the stored (UTC) events are displayed in. */
  timezone: string;
  events: BusyEvent[];
  /** Id of the event currently open in the edit form, if any. */
  editingId?: string;
  onEdit: (event: BusyEvent) => void;
  onRemove: (eventId: string) => void;
}

/** Compact day summary: "Mon–Fri", "Sat Sun", "Every day". */
function daysLabel(days: number[]): string {
  if (days.length === 7) return "Every day";
  const sorted = [...days].sort();
  const contiguous = sorted.every((d, i) => i === 0 || d === sorted[i - 1] + 1);
  if (contiguous && sorted.length >= 3) {
    return `${DAYS[sorted[0]]}–${DAYS[sorted[sorted.length - 1]]}`;
  }
  return sorted.map((d) => DAYS[d]).join(" ");
}

export function EventList({
  timezone,
  events,
  editingId,
  onEdit,
  onRemove,
}: EventListProps) {
  // Show events in the person's own zone, ordered through the week.
  const rows = useMemo(
    () =>
      events
        .map((ev) => ({
          ev,
          display: convertEventDaysFromUTC(
            ev.days,
            ev.startTime,
            ev.endTime,
            timezone,
          ),
        }))
        .sort(
          (a, b) =>
            (a.display.days[0] ?? 0) - (b.display.days[0] ?? 0) ||
            timeToMins(a.display.startTime) - timeToMins(b.display.startTime),
        ),
    [events, timezone],
  );

  if (events.length === 0) {
    return (
      <div className="border-t border-border py-6 text-center">
        <span className="eyebrow">No busy times yet — you&apos;re free all week</span>
      </div>
    );
  }

  return (
    <ul className="border-t border-border">
      {rows.map(({ ev, display }) => {
        const recurring = ev.type === "recurring";
        const editing = ev.id === editingId;
        return (
          <li
            key={ev.id}
            className={`group -mx-2 flex items-center border-b border-border px-2 transition-colors ${
              editing ? "bg-maroon-light" : "hover:bg-bg"
            }`}
          >
            <button
              type="button"
              onClick={() => onEdit(ev)}
              className="flex min-w-0 flex-1 items-center gap-4 py-3 text-left"
              title="Edit"
              aria-label={`Edit ${ev.title}`}
            >
              <span
                className={`h-2.5 w-2.5 shrink-0 ${
                  recurring ? "bg-maroon" : "bg-amber"
                }`}
                style={{ borderRadius: 1 }}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{ev.title}</div>
                <div className="mt-0.5 flex items-baseline gap-2">
                  <span
                    className={`eyebrow ${recurring ? "text-maroon" : "text-amber"}`}
                  >
                    {recurring ? "Weekly" : "One-off"}
                  </span>
                  <span className="eyebrow sm:hidden">
                    · {daysLabel(display.days)}
                  </span>
                </div>
              </div>
              <div className="hidden font-mono text-[11px] uppercase tracking-[0.12em] text-text-2 sm:block">
                {daysLabel(display.days)}
              </div>
              <div className="shrink-0 text-right font-mono text-[13px] tabular-nums sm:w-[120px]">
                {formatTimeStr(display.startTime)}–
                {formatTimeStr(display.endTime)}
              </div>
            </button>
            <button
              type="button"
              onClick={() => onRemove(ev.id)}
              className="ml-2 shrink-0 p-1.5 text-text-3 opacity-70 transition-all hover:text-red hover:opacity-100 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              title="Remove"
              aria-label={`Remove ${ev.title}`}
            >
              <IconClose width={16} height={16} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
