"use client";

import { useMemo } from "react";
import { Person } from "@/types";
import { buildBusyMatrix } from "@/lib/availability";
import { localizePerson } from "@/lib/session";
import { SLOTS_PER_DAY } from "@/lib/time";

const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOUR_MARKS = [0, 6, 12, 18, 24];

/**
 * A compact week-at-a-glance: one thin track per day, 24h wide, with busy
 * time drawn as solid blocks. Rendered in the person's own timezone so it
 * matches the times they typed.
 */
export function WeekStrip({
  person,
  onPick,
}: {
  person: Person;
  /** Called with a day and half-hour slot when a free spot is clicked. */
  onPick?: (day: number, slot: number) => void;
}) {
  const matrix = useMemo(
    () => buildBusyMatrix(localizePerson(person, person.timezone)),
    [person],
  );

  // Collapse each day's slots into contiguous busy runs.
  const runs = useMemo(
    () =>
      matrix.map((day) => {
        const out: { start: number; len: number }[] = [];
        let start = -1;
        for (let s = 0; s <= SLOTS_PER_DAY; s++) {
          const busy = s < SLOTS_PER_DAY && day[s];
          if (busy && start < 0) start = s;
          if (!busy && start >= 0) {
            out.push({ start, len: s - start });
            start = -1;
          }
        }
        return out;
      }),
    [matrix],
  );

  const busyHours =
    matrix.reduce((n, day) => n + day.filter(Boolean).length, 0) / 2;

  return (
    <div className="border border-border bg-surface px-4 pb-3 pt-3.5">
      <div className="mb-2.5 flex items-baseline justify-between">
        <span className="eyebrow">
          Week at a glance
          {onPick && (
            <span className="hidden text-text-3 sm:inline" aria-hidden="true">
              {" "}
              · click to add
            </span>
          )}
        </span>
        <span className="eyebrow">
          <span className="text-text">{busyHours}h</span> busy
        </span>
      </div>
      {/* Visual only: the event list below carries the same information, and
          "Add event" is the keyboard route to what clicking here does. */}
      <div className="flex flex-col gap-[5px]" aria-hidden="true">
        {runs.map((dayRuns, d) => (
          <div key={d} className="flex items-center gap-3">
            <span className="w-7 shrink-0 font-mono text-[10px] uppercase tracking-[0.08em] text-text-2">
              {DAYS_SHORT[d]}
            </span>
            <div
              className={`relative h-[12px] flex-1 bg-bg ${
                onPick ? "cursor-copy transition-colors hover:bg-maroon-light" : ""
              }`}
              onClick={
                onPick
                  ? (e) => {
                      const r = e.currentTarget.getBoundingClientRect();
                      const frac = (e.clientX - r.left) / r.width;
                      // Snap to the hour so the prefilled event is tidy.
                      const slot = Math.floor(frac * 24) * 2;
                      onPick(d, Math.min(Math.max(slot, 0), SLOTS_PER_DAY - 2));
                    }
                  : undefined
              }
            >
              {/* faint 6-hour guides */}
              {[6, 12, 18].map((h) => (
                <span
                  key={h}
                  className="pointer-events-none absolute inset-y-0 w-px bg-border"
                  style={{ left: `${(h / 24) * 100}%` }}
                />
              ))}
              {dayRuns.map((r) => (
                <span
                  key={r.start}
                  className="pointer-events-none absolute inset-y-0 bg-maroon"
                  style={{
                    left: `${(r.start / SLOTS_PER_DAY) * 100}%`,
                    width: `${(r.len / SLOTS_PER_DAY) * 100}%`,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="relative ml-10 mt-1.5 h-3" aria-hidden="true">
        {HOUR_MARKS.map((h) => (
          <span
            key={h}
            className="absolute font-mono text-[9px] uppercase text-text-3"
            style={{
              left: `${(h / 24) * 100}%`,
              transform:
                h === 0 ? "none" : h === 24 ? "translateX(-100%)" : "translateX(-50%)",
            }}
          >
            {h === 0 || h === 24 ? "12a" : h === 12 ? "12p" : h < 12 ? `${h}a` : `${h - 12}p`}
          </span>
        ))}
      </div>
    </div>
  );
}
