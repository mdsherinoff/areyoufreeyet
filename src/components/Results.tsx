"use client";

import { useMemo, useState } from "react";
import { useSession } from "@/context/SessionContext";
import {
  buildBusyMatrix,
  buildFreeCounts,
  findFreeWindows,
  isDayVisible,
  DayFilter,
  FreeWindow,
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
const DAY_LABEL_W = 44;
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

  const slotCount = rangeEnd - rangeStart;
  const hourCount = slotCount / 2;
  // Label every hour when there's room, otherwise every other hour.
  const labelEvery = hourCount > 14 ? 2 : 1;
  const hours: number[] = [];
  for (let s = rangeStart; s < rangeEnd; s += 2) hours.push(s / 2);

  const others = people.filter((p) => p.timezone !== viewerTz);
  const totalFreeMins = windows.reduce((n, w) => n + w.durationMins, 0);

  // Best bet: the longest window that starts at a sociable hour (8am–9pm),
  // falling back to the longest overall. Ties go to the earliest in the week.
  const best = useMemo(() => {
    if (windows.length === 0) return null;
    const pick = (list: FreeWindow[]) =>
      list.reduce<FreeWindow | null>(
        (b, w) => (!b || w.durationMins > b.durationMins ? w : b),
        null,
      );
    const sociable = windows.filter(
      (w) => w.startSlot < 42 && w.endSlot >= 16,
    );
    return pick(sociable.length ? sociable : windows);
  }, [windows]);

  const byDay = useMemo(() => {
    const groups = new Map<number, FreeWindow[]>();
    for (const w of windows) {
      if (!groups.has(w.day)) groups.set(w.day, []);
      groups.get(w.day)!.push(w);
    }
    return [...groups.entries()];
  }, [windows]);

  const fmt = (w: FreeWindow) => windowTimes(w, viewerTz, others);
  const bestT = best ? fmt(best) : null;

  return (
    <div>
      {/* Controls */}
      <div className="mb-8 flex flex-wrap items-start gap-x-10 gap-y-4">
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

      {/* Best bet */}
      {best && bestT && (
        <div className="mb-10 grid gap-6 bg-maroon p-6 text-white shadow-pop sm:grid-cols-[1fr_auto] sm:items-end sm:p-8">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/70">
              Best bet{total > 1 ? " · everyone free" : ""}
            </div>
            <div className="display mt-3 text-[clamp(34px,7vw,52px)] uppercase">
              {DAYS[best.day]}
            </div>
            <div className="mt-2 font-mono text-[18px] tabular-nums sm:text-[20px]">
              {bestT.allDay
                ? "All day"
                : `${bestT.start} – ${bestT.end}`}
              <span className="ml-3 text-[13px] uppercase tracking-[0.12em] text-white/70">
                {durationLabel(best.durationMins)}
              </span>
            </div>
            {bestT.others.length > 0 && (
              <div className="mt-3 flex flex-col gap-0.5 text-[12px] text-white/75">
                {bestT.others.map((o) => (
                  <div key={o.id} className="font-mono tabular-nums">
                    <span className="text-white">{o.name}</span> · {o.start} –{" "}
                    {o.end} {o.tz}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-6 border-t border-white/20 pt-4 sm:flex-col sm:gap-3 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
            <Stat value={String(windows.length)} label="windows" />
            <Stat value={durationLabel(totalFreeMins)} label="shared free" />
            <Stat value={String(total)} label={total === 1 ? "person" : "people"} />
          </div>
        </div>
      )}

      {/* Heatmap */}
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="display text-[20px] uppercase">Overlap map</h3>
        <span className="eyebrow">
          Times in <span className="text-maroon">{tzLabel(viewerTz)}</span>
        </span>
      </div>
      <div className="mb-3 overflow-x-auto border border-border bg-surface p-4">
        <div className="min-w-[520px]">
          {/* Hour ruler */}
          <div
            className="mb-2 grid"
            style={{
              paddingLeft: DAY_LABEL_W,
              gridTemplateColumns: `repeat(${hourCount}, minmax(0, 1fr))`,
            }}
          >
            {hours.map((h, i) => (
              <div
                key={h}
                className="font-mono text-[10px] uppercase text-text-3"
              >
                {i % labelEvery === 0 ? formatHourLabel(h % 24) : ""}
              </div>
            ))}
          </div>

          {/* Day rows */}
          <div className="flex flex-col gap-1">
            {visibleDays.map((d) => (
              <div key={d} className="flex items-center">
                <div
                  className="shrink-0 font-mono text-[11px] uppercase tracking-[0.1em] text-text-2"
                  style={{ width: DAY_LABEL_W }}
                >
                  {DAYS_SHORT[d]}
                </div>
                <div
                  className="grid flex-1 bg-bg"
                  style={{
                    gridTemplateColumns: `repeat(${slotCount}, minmax(0, 1fr))`,
                  }}
                >
                  {Array.from({ length: slotCount }, (_, i) => {
                    const s = rangeStart + i;
                    const free = freeCounts[d][s];
                    const frac = total ? free / total : 0;
                    const all = total > 0 && free === total;
                    const bg = all
                      ? `rgb(${MAROON_RGB})`
                      : `rgba(${MAROON_RGB}, ${(frac * 0.45 + (frac > 0 ? 0.06 : 0)).toFixed(3)})`;
                    return (
                      <div
                        key={s}
                        title={`${DAYS_SHORT[d]} ${formatTimeStr(slotToTime(s))} · ${free}/${total} free`}
                        className="h-7 transition-[filter] hover:brightness-90"
                        style={{
                          backgroundColor: bg,
                          boxShadow:
                            s % 2 === 0 && i !== 0
                              ? "inset 1px 0 0 rgba(255,255,255,0.55)"
                              : undefined,
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
      <div className="mb-12 flex items-center gap-2">
        <span className="eyebrow">Fewer free</span>
        <div className="flex">
          {[0.12, 0.28, 0.45, 1].map((a, i) => (
            <div
              key={i}
              style={{
                width: 22,
                height: 10,
                backgroundColor:
                  a === 1 ? `rgb(${MAROON_RGB})` : `rgba(${MAROON_RGB}, ${a})`,
              }}
            />
          ))}
        </div>
        <span className="eyebrow">Everyone free</span>
      </div>

      {/* Windows, grouped by day */}
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="display text-[20px] uppercase">
          {total === 1 ? "When you're free" : "When everyone's free"}
        </h3>
        <span className="eyebrow">
          Blocks of {durationLabel(minBlockHours * 60)}+
        </span>
      </div>
      <div className="mb-6" />

      {windows.length === 0 ? (
        <div className="border border-dashed border-border-mid bg-surface/40 px-6 py-12 text-center">
          <div className="display mb-2 text-[22px] uppercase text-text-3">
            Nothing lines up
          </div>
          <div className="text-[13px] text-text-2">
            Try a shorter minimum block or a different day filter.
          </div>
        </div>
      ) : (
        <div className="border-t border-border">
          {byDay.map(([day, list]) => (
            <div
              key={day}
              className="grid gap-3 border-b border-border py-5 sm:grid-cols-[120px_1fr]"
            >
              <div className="font-display text-[17px] font-bold tracking-tight">
                {DAYS[day]}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {list.map((w) => {
                  const t = fmt(w);
                  const isBest = w === best;
                  return (
                    <div
                      key={w.startSlot}
                      className={`border px-4 py-3 transition-colors ${
                        isBest
                          ? "border-maroon bg-maroon-light"
                          : "border-border bg-surface hover:border-border-mid"
                      }`}
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-mono text-[14px] tabular-nums">
                          {t.allDay ? "All day" : `${t.start} – ${t.end}`}
                        </span>
                        <span
                          className={`eyebrow ${isBest ? "text-maroon" : ""}`}
                        >
                          {durationLabel(w.durationMins)}
                        </span>
                      </div>
                      {t.others.length > 0 && (
                        <div className="mt-1.5 flex flex-col gap-0.5">
                          {t.others.map((o) => (
                            <div
                              key={o.id}
                              className="flex items-baseline gap-2 text-[11px]"
                            >
                              <span className="truncate font-medium text-text-2">
                                {o.name}
                              </span>
                              <span className="font-mono tabular-nums text-text-3">
                                {o.start}–{o.end}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Format a window's start/end in the viewer's zone and each other person's. */
function windowTimes(
  w: FreeWindow,
  viewerTz: string,
  others: { id: string; name: string; timezone: string }[],
) {
  const startStr = slotToTime(w.startSlot);
  const endInclusiveNext = w.endSlot + 1;
  const allDay = w.durationMins >= 1440;
  const end = allDay
    ? ""
    : endInclusiveNext * SLOT_MINS >= 1440
      ? "12am"
      : formatTimeStr(slotToTime(endInclusiveNext));
  // Prefix a converted time with its weekday when it lands on another day.
  const withDay = (c: { day: number; time: string }, ref: number) =>
    (c.day !== ref ? `${DAYS_SHORT[c.day]} ` : "") + formatTimeStr(c.time);
  return {
    allDay,
    start: allDay ? "All day" : formatTimeStr(startStr),
    end,
    others: others.map((p) => {
      const ps = convertWallTimeBetweenZones(w.day, startStr, viewerTz, p.timezone);
      // "24:00" rolls to next-day 00:00 during conversion, so a window ending
      // at midnight maps to the correct instant.
      const pe = convertWallTimeBetweenZones(
        w.day,
        slotToTime(endInclusiveNext),
        viewerTz,
        p.timezone,
      );
      return {
        id: p.id,
        name: p.name,
        tz: tzLabel(p.timezone),
        start: withDay(ps, w.day),
        end: withDay(pe, ps.day),
      };
    }),
  };
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display text-[22px] font-bold leading-none tabular-nums">
        {value}
      </div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white/70">
        {label}
      </div>
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
