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
const MAROON_RGB = "138, 21, 56";

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
      <div className="mb-7 flex flex-wrap items-start gap-x-10 gap-y-4">
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

      <div className="eyebrow mb-4">
        {total} {total === 1 ? "person" : "people"} · times in{" "}
        <span className="text-maroon">{tzLabel(viewerTz)}</span>
      </div>

      {/* Heatmap */}
      <div className="-mx-1 mb-3 overflow-x-auto px-1">
        <div
          style={{ minWidth: DAY_LABEL_W + (rangeEnd - rangeStart) * SLOT_PX }}
        >
          {/* Hour ruler */}
          <div className="mb-1.5 flex" style={{ paddingLeft: DAY_LABEL_W }}>
            {hours.map((h) => (
              <div
                key={h}
                className="shrink-0 font-mono text-[9px] uppercase tracking-wide text-text-3"
                style={{ width: SLOT_PX * 2 }}
              >
                {formatHourLabel(h % 24)}
              </div>
            ))}
          </div>

          {/* Day rows */}
          <div className="flex flex-col gap-[3px]">
            {visibleDays.map((d) => (
              <div key={d} className="flex items-center">
                <div
                  className="shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] text-text-2"
                  style={{ width: DAY_LABEL_W }}
                >
                  {DAYS_SHORT[d]}
                </div>
                <div className="flex border border-border bg-bg">
                  {Array.from({ length: rangeEnd - rangeStart }, (_, i) => {
                    const s = rangeStart + i;
                    const free = freeCounts[d][s];
                    const frac = total ? free / total : 0;
                    const all = total > 0 && free === total;
                    const bg = all
                      ? `rgb(${MAROON_RGB})`
                      : `rgba(${MAROON_RGB}, ${(frac * 0.5 + (frac > 0 ? 0.06 : 0)).toFixed(3)})`;
                    return (
                      <div
                        key={s}
                        title={`${DAYS_SHORT[d]} ${slotToTime(s)} · ${free}/${total} free`}
                        style={{
                          width: SLOT_PX,
                          height: 26,
                          backgroundColor: bg,
                          borderLeft:
                            s % 2 === 0 && i !== 0
                              ? "1px solid rgba(27,25,23,0.06)"
                              : "none",
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
      <div className="mb-10 flex items-center gap-2">
        <span className="eyebrow">Fewer</span>
        <div className="flex border border-border">
          {[0.16, 0.34, 0.56, 1].map((a, i) => (
            <div
              key={i}
              style={{
                width: 18,
                height: 12,
                backgroundColor:
                  a === 1 ? `rgb(${MAROON_RGB})` : `rgba(${MAROON_RGB}, ${a})`,
              }}
            />
          ))}
        </div>
        <span className="eyebrow">Everyone free</span>
      </div>

      {/* Ranked windows */}
      <div className="mb-1 flex items-baseline gap-3">
        <span className="font-mono text-[13px] text-maroon">→</span>
        <h3 className="display text-[20px] uppercase">
          {total === 1 ? "When you're free" : "When everyone's free"}
        </h3>
      </div>
      <div className="mb-6 text-[13px] text-text-2">
        Blocks of at least {durationLabel(minBlockHours * 60)} with no events.
      </div>

      {windows.length === 0 ? (
        <div className="border border-dashed border-border-mid px-6 py-10 text-center">
          <div className="eyebrow mb-2">Nothing lines up</div>
          <div className="text-[13px] text-text-2">
            Try a shorter minimum block or a different day filter.
          </div>
        </div>
      ) : (
        <div className="border-t border-border">
          {windows.map((w, i) => {
            const startStr = slotToTime(w.startSlot);
            const endInclusiveNext = w.endSlot + 1;
            const endMins = endInclusiveNext * SLOT_MINS;
            const viewerEnd =
              endMins >= 1440
                ? "12am"
                : formatTimeStr(slotToTime(endInclusiveNext));
            const others = people.filter((p) => p.timezone !== viewerTz);
            return (
              <div key={i} className="border-b border-border py-4">
                <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
                  <div className="w-2 self-center bg-maroon" style={{ height: 20 }} />
                  <div className="font-display text-[17px] font-bold tracking-tight min-w-[104px]">
                    {DAYS[w.day]}
                  </div>
                  <div className="font-mono text-[14px] tabular-nums">
                    {formatTimeStr(startStr)} – {viewerEnd}
                  </div>
                  <div className="eyebrow ml-auto">
                    {durationLabel(w.durationMins)}
                  </div>
                </div>
                {others.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1 pl-5 sm:pl-[132px]">
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
                        <div
                          key={p.id}
                          className="flex items-baseline gap-3 text-[12px]"
                        >
                          <span className="eyebrow min-w-[72px] normal-case tracking-normal">
                            {p.name}
                          </span>
                          <span className="font-mono tabular-nums text-text-2">
                            {formatTimeStr(ps.time)} – {formatTimeStr(pe.time)}
                          </span>
                          <span className="eyebrow">{tzLabel(p.timezone)}</span>
                        </div>
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
      <div className="eyebrow mb-2">{label}</div>
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
    <div className="inline-flex border border-border-mid">
      {options.map((o, idx) => (
        <button
          key={String(o.value)}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-3.5 py-2 text-[12px] font-medium transition-colors ${
            idx > 0 ? "border-l border-border-mid" : ""
          } ${
            o.value === value
              ? "bg-maroon text-white"
              : "bg-transparent text-text-2 hover:text-text"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
