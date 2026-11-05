"use client";

import { useEffect, useId, useRef, useState } from "react";
import { scrollBehavior } from "@/lib/motion";
import { BusyEvent } from "@/types";
import { createEvent } from "@/lib/factory";
import { convertEventDaysToUTC } from "@/lib/timezone";
import { durationLabel, timeToMins } from "@/lib/time";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAYS_FULL = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const PRESETS: { label: string; days: number[] }[] = [
  { label: "Weekdays", days: [0, 1, 2, 3, 4] },
  { label: "Weekend", days: [5, 6] },
  { label: "Every day", days: [0, 1, 2, 3, 4, 5, 6] },
];

/** Wall-clock values (in the form's timezone) used to prefill the form. */
export interface EventDraft {
  title: string;
  type: "recurring" | "once";
  days: number[];
  startTime: string;
  endTime: string;
}

interface EventFormProps {
  /** Timezone the entered wall-clock times are interpreted in. */
  timezone: string;
  /** Prefill values (editing an event, or a slot clicked on the week strip). */
  initial?: Partial<EventDraft>;
  /** When set, the form edits this event instead of creating a new one. */
  editingId?: string;
  onSubmit: (event: BusyEvent) => void;
  onCancel: () => void;
}

export function EventForm({
  timezone,
  initial,
  editingId,
  onSubmit,
  onCancel,
}: EventFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [type, setType] = useState<"recurring" | "once">(
    initial?.type ?? "recurring",
  );
  const [days, setDays] = useState<number[]>(initial?.days ?? []);
  const [startTime, setStartTime] = useState(initial?.startTime ?? "09:00");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "10:00");
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const typeRefs = useRef<(HTMLButtonElement | null)[]>([]);
  // Unique ids: several forms can exist on the page (one per person card).
  const uid = useId();
  const ids = {
    heading: `${uid}-heading`,
    title: `${uid}-title`,
    repeats: `${uid}-repeats`,
    days: `${uid}-days`,
    from: `${uid}-from`,
    to: `${uid}-to`,
    error: `${uid}-error`,
  };

  // Bring the form into view and focus the title when it opens.
  useEffect(() => {
    rootRef.current?.scrollIntoView({ block: "nearest", behavior: scrollBehavior() });
    titleRef.current?.focus({ preventScroll: true });
  }, []);

  // Equal times = zero-length (invalid); end < start = crosses midnight (ok).
  const overnight = endTime < startTime;
  const lengthMins =
    endTime === startTime
      ? 0
      : (timeToMins(endTime) - timeToMins(startTime) + 1440) % 1440;

  const toggleDay = (dayIndex: number) => {
    setError(null);
    setDays((prev) =>
      prev.includes(dayIndex)
        ? prev.filter((d) => d !== dayIndex)
        : [...prev, dayIndex].sort(),
    );
  };

  const sameDays = (a: number[], b: number[]) =>
    a.length === b.length && a.every((d) => b.includes(d));

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (days.length === 0) {
      setError("Pick at least one day.");
      return;
    }
    if (endTime === startTime) {
      setError("Start and end time can't be the same.");
      return;
    }
    setError(null);

    // Convert the entered wall-clock days/times (in the selected display
    // timezone) into UTC, correctly handling any day-of-week shift caused
    // by the conversion (e.g. 1am local time can land on the previous UTC day).
    const utc = convertEventDaysToUTC(days, startTime, endTime, timezone);

    const fields = {
      title: title.trim() || "Busy",
      type,
      days: utc.days,
      startTime: utc.startTime,
      endTime: utc.endTime,
    };
    onSubmit(editingId ? { id: editingId, ...fields } : createEvent(fields));
  };

  const inputCls =
    "border-b-2 border-border bg-transparent px-1 py-2 text-sm outline-none transition-colors focus:border-maroon";

  return (
    <form
      ref={rootRef}
      onSubmit={handleSubmit}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onCancel();
        }
      }}
      aria-labelledby={ids.heading}
      noValidate
      className="mt-6 scroll-mt-6 border-l-2 border-maroon pl-5"
    >
      <h4 id={ids.heading} className="eyebrow mb-5 text-maroon">
        {editingId ? "Edit busy time" : "Add busy time"}
      </h4>

      <div className="mb-5">
        <label htmlFor={ids.title} className="eyebrow mb-2 block">
          Title
        </label>
        <input
          id={ids.title}
          ref={titleRef}
          type="text"
          placeholder="e.g. Maths lecture"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`${inputCls} w-full`}
        />
      </div>

      <div className="mb-5">
        <span id={ids.repeats} className="eyebrow mb-2 block">
          Repeats
        </span>
        <div
          className="inline-flex border border-border-mid"
          role="radiogroup"
          aria-labelledby={ids.repeats}
          onKeyDown={(e) => {
            // Arrow keys move between options, as with native radios.
            const order = ["recurring", "once"] as const;
            const delta =
              e.key === "ArrowRight" || e.key === "ArrowDown"
                ? 1
                : e.key === "ArrowLeft" || e.key === "ArrowUp"
                  ? -1
                  : 0;
            if (!delta) return;
            e.preventDefault();
            const next = (order.indexOf(type) + delta + order.length) % order.length;
            setType(order[next]);
            typeRefs.current[next]?.focus();
          }}
        >
          {(["recurring", "once"] as const).map((t, i) => (
            <button
              key={t}
              ref={(el) => {
                typeRefs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={type === t}
              tabIndex={type === t ? 0 : -1}
              onClick={() => setType(t)}
              className={`px-4 py-2 text-[13px] font-medium transition-colors ${
                type === t
                  ? "bg-maroon text-white"
                  : "bg-transparent text-text-2 hover:text-text"
              }`}
            >
              {t === "recurring" ? "Weekly" : "One-off"}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <div className="mb-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span id={ids.days} className="eyebrow">
            Days
          </span>
          <div className="flex gap-3" role="group" aria-label="Day presets">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                aria-pressed={sameDays(days, p.days)}
                onClick={() => {
                  setError(null);
                  setDays(sameDays(days, p.days) ? [] : p.days);
                }}
                className={`text-[12px] font-medium underline-offset-4 transition-colors hover:underline ${
                  sameDays(days, p.days) ? "text-maroon underline" : "text-text-2"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div
          className="flex flex-wrap gap-1.5"
          role="group"
          aria-labelledby={ids.days}
          aria-describedby={error ? ids.error : undefined}
        >
          {DAYS.map((d, i) => (
            <button
              type="button"
              key={i}
              onClick={() => toggleDay(i)}
              aria-pressed={days.includes(i)}
              aria-label={DAYS_FULL[i]}
              className={`h-9 w-11 border font-mono text-[11px] font-medium uppercase transition-colors ${
                days.includes(i)
                  ? "border-maroon bg-maroon text-white"
                  : "border-border-mid bg-transparent text-text-2 hover:border-text"
              }`}
            >
              <span aria-hidden="true">{d.slice(0, 2)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor={ids.from} className="eyebrow mb-2 block">
            From
          </label>
          <input
            id={ids.from}
            aria-describedby={error ? ids.error : undefined}
            type="time"
            step={1800}
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className={`${inputCls} font-mono`}
          />
        </div>
        <div>
          <label htmlFor={ids.to} className="eyebrow mb-2 block">
            To
          </label>
          <input
            id={ids.to}
            aria-describedby={error ? ids.error : undefined}
            type="time"
            step={1800}
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className={`${inputCls} font-mono`}
          />
        </div>
        <div className="eyebrow pb-2.5" aria-live="polite">
          {lengthMins > 0 && (
            <>
              {durationLabel(lengthMins)}
              {overnight && " · ends next day"}
            </>
          )}
        </div>
      </div>

      {error && (
        <div id={ids.error} role="alert" className="mb-4 text-[13px] text-red">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="bg-maroon px-5 py-2.5 font-mono text-[12px] uppercase tracking-[0.14em] text-white transition-colors hover:bg-maroon-dark active:scale-[0.98]"
        >
          {editingId ? "Save" : "Add"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-[13px] font-medium text-text-2 transition-colors hover:text-text"
        >
          Cancel
        </button>
        <span
          aria-hidden="true"
          className="eyebrow ml-auto hidden text-text-3 sm:inline"
        >
          Enter to save · Esc to cancel
        </span>
      </div>
    </form>
  );
}
