"use client";

import { useMemo, useState } from "react";
import { useSession } from "@/context/SessionContext";
import {
  buildBusyMatrix,
  buildFreeCounts,
  findFreeWindows,
  isDayVisible,
  DayFilter,
} from "@/lib/availability";
import { localizePerson } from "@/lib/session";
import {
  convertWallTimeBetweenZones,
  tzLabel,
} from "@/lib/timezone";
import {
  SLOT_MINS,
  SLOTS_PER_DAY,
  slotToTime,
  formatTimeStr,
  formatHourLabel,
  durationLabel,
} from "@/lib/time";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SLOT_PX = 15;
const DAY_LABEL_W = 38;
const GREEN_RGB = "26, 158, 117";

const BLOCK_OPTIONS = [
  { label: "30 min", value: 0.5 },
  { label: "1 hour", value: 1 },
  { label: "2 hours", value: 2 },
  { label: "3 hours", value: 3 },
];

const FILTER_OPTIONS: { label: string; value: DayFilter }[] = [
  { label: "All days", value: "all" },
  { label: "Weekdays", value: "weekday" },
  { label: "Weekend", value: "weekend" },
];

export function Results() {
  const { session } = useSession();
  const people = session.people;
  const viewerTz = people[0]?.timezone ?? "UTC";

  const [minBlockHours, setMinBlockHours] = useState(1);
  const [dayFilter, setDayFilter] = useState<DayFilter>("all");

  // Localize everyone to the viewer's timezone, then build the busy matrices
  // so the whole results view is computed and drawn in one consistent zone.
  const matrices = useMemo(
    () => people.map((p) => buildBusyMatrix(localizePerson(p, viewerTz))),
    [people, viewerTz],
  );

  const freeCounts = useMemo(() => buildFreeCounts(matrices), [matrices]);
  const windows = useMemo(
    () => findFreeWindows(matrices, minBlockHours, dayFilter),
    [matrices, minBlockHours, dayFilter],
  );

  const total = people.length;
  const visibleDays = [0, 1, 2, 3, 4, 5, 6].filter((d) =>
    isDayVisible(d, dayFilter),
  );

  // Slot range to render: bound to busy times, padded, and always covering a
  // reasonable daytime window, snapped to whole hours.
  const [rangeStart, rangeEnd] = useMemo(() => {
    let lo = SLOTS_PER_DAY;
    let hi = 0;
    for (const m of matrices) {
      for (const d of visibleDays) {
        for (let s = 0; s < SLOTS_PER_DAY; s++) {
          if (m[d][s]) {
            lo = Math.min(lo, s);
            hi = Math.max(hi, s + 1);
          }
        }
      }
    }
    if (lo > hi) {
      lo = 16;
      hi = 44;
    }
    lo = Math.min(Math.max(0, lo - 2), 16);
    hi = Math.max(Math.min(SLOTS_PER_DAY, hi + 2), 44);
    lo -= lo % 2;
    hi += hi % 2;
    return [lo, hi];
  }, [matrices, visibleDays]);

  const hours: number[] = [];
  for (let s = rangeStart; s < rangeEnd; s += 2) hours.push(s / 2);

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-5">
        <Control label="Min free block">
          <Segmented
            options={BLOCK_OPTIONS}
            value={minBlockHours}
            onChange={setMinBlockHours}
          />
        </Control>
        <Control label="Days">
          <Segmented
            options={FILTER_OPTIONS}
            value={dayFilter}
            onChange={setDayFilter}
          />
        </Control>
      </div>

      <div className="text-[13px] text-text-2 mb-4">
        Comparing <strong className="text-text font-medium">{total}</strong>{" "}
        {total === 1 ? "person" : "people"} · times shown in{" "}
        <strong className="text-text font-medium">{tzLabel(viewerTz)}</strong>
      </div>

      {/* Heatmap */}
      <div className="overflow-x-auto -mx-1 px-1 mb-2">
        <div style={{ minWidth: DAY_LABEL_W + (rangeEnd - rangeStart) * SLOT_PX }}>
          {/* Hour ruler */}
          <div className="flex mb-1" style={{ paddingLeft: DAY_LABEL_W }}>
            {hours.map((h) => (
              <div
                key={h}
                className="text-[9px] text-text-3 shrink-0"
                style={{ width: SLOT_PX * 2 }}
              >
                {formatHourLabel(h % 24)}
              </div>
            ))}
          </div>

          {/* Day rows */}
          <div className="flex flex-col gap-1">
            {visibleDays.map((d) => (
              <div key={d} className="flex items-center">
                <div
                  className="text-[11px] text-text-2 shrink-0"
                  style={{ width: DAY_LABEL_W }}
                >
                  {DAYS_SHORT[d]}
                </div>
                <div className="flex">
                  {Array.from({ length: rangeEnd - rangeStart }, (_, i) => {
                    const s = rangeStart + i;
                    const free = freeCounts[d][s];
                    const frac = total ? free / total : 0;
                    const all = total > 0 && free === total;
                    const bg = all
                      ? `rgb(${GREEN_RGB})`
                      : `rgba(${GREEN_RGB}, ${(frac * 0.55).toFixed(3)})`;
                    return (
                      <div
                        key={s}
                        title={`${DAYS_SHORT[d]} ${slotToTime(s)} · ${free}/${total} free`}
                        style={{
                          width: SLOT_PX,
                          height: 22,
                          backgroundColor: bg,
                          borderLeft:
                            s % 2 === 0 ? "1px solid var(--color-border)" : "none",
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 text-[11px] text-text-3 mb-8">
        <span>Fewer free</span>
        <div className="flex">
          {[0.1, 0.3, 0.55, 1].map((a, i) => (
            <div
              key={i}
              style={{
                width: 16,
                height: 12,
                backgroundColor:
                  a === 1 ? `rgb(${GREEN_RGB})` : `rgba(${GREEN_RGB}, ${a})`,
              }}
            />
          ))}
        </div>
        <span>Everyone free</span>
      </div>

      {/* Ranked windows */}
      <div className="text-base font-medium mb-1">
        {total === 1 ? "When you're free" : "When everyone's free"}
      </div>
      <div className="text-[13px] text-text-2 mb-4">
        Blocks of at least {durationLabel(minBlockHours * 60)} where{" "}
        {total === 1 ? "you have" : "all have"} no events.
      </div>

      {windows.length === 0 ? (
        <div className="border border-border rounded-card p-8 text-center text-text-3 text-sm bg-bg">
          No common free time with these settings.
          <br />
          Try a shorter minimum block or a different day filter.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {windows.map((w, i) => {
            const startStr = slotToTime(w.startSlot);
            const endInclusiveNext = w.endSlot + 1;
            const endMins = endInclusiveNext * SLOT_MINS;
            const viewerEnd =
              endMins >= 1440 ? "12am" : formatTimeStr(slotToTime(endInclusiveNext));
            const others = people.filter((p) => p.timezone !== viewerTz);
            return (
              <div
                key={i}
                className="border border-border rounded-control px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1"
              >
                <div className="w-2 h-2 rounded-full bg-green shrink-0" />
                <div className="font-medium text-sm min-w-[84px]">
                  {DAYS[w.day]}
                </div>
                <div className="text-sm">
                  {formatTimeStr(startStr)} – {viewerEnd}
                </div>
                <div className="text-xs text-text-3">
                  {durationLabel(w.durationMins)}
                </div>
                {others.length > 0 && (
                  <div className="basis-full flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-text-2 pl-6">
                    {others.map((p) => {
                      const ps = convertWallTimeBetweenZones(
                        w.day,
                        startStr,
                        viewerTz,
                        p.timezone,
                      );
                      // "24:00" rolls to next-day 00:00 during conversion, so
                      // a window ending at midnight maps to the correct instant.
                      const pe = convertWallTimeBetweenZones(
                        w.day,
                        slotToTime(endInclusiveNext),
                        viewerTz,
                        p.timezone,
                      );
                      return (
                        <span key={p.id}>
                          <span className="text-text-3">{p.name}:</span>{" "}
                          {formatTimeStr(ps.time)} – {formatTimeStr(pe.time)}{" "}
                          <span className="text-text-3">
                            ({tzLabel(p.timezone)})
                          </span>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Control({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs text-text-2 mb-1.5">{label}</div>
      {children}
    </div>
  );
}

function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex bg-surface border border-border rounded-control p-0.5">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 rounded-[7px] text-[13px] transition-colors ${
            o.value === value
              ? "bg-green text-white font-medium"
              : "text-text-2 hover:text-text"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
