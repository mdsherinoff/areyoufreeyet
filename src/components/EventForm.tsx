"use client";

import { useState } from "react";
import { BusyEvent } from "@/types";
import { createEvent } from "@/lib/factory";
import { convertEventDaysToUTC } from "@/lib/timezone";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface EventFormProps {
  /** Timezone the entered wall-clock times are interpreted in. */
  timezone: string;
  onAdd: (event: BusyEvent) => void;
  onCancel: () => void;
}

export function EventForm({ timezone, onAdd, onCancel }: EventFormProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"recurring" | "once">("recurring");
  const [days, setDays] = useState<number[]>([]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [error, setError] = useState<string | null>(null);

  // Equal times = zero-length (invalid); end < start = crosses midnight (ok).
  const overnight = endTime < startTime;

  const toggleDay = (dayIndex: number) => {
    setDays((prev) =>
      prev.includes(dayIndex)
        ? prev.filter((d) => d !== dayIndex)
        : [...prev, dayIndex],
    );
  };

  const handleSubmit = () => {
    if (days.length === 0) {
      setError("Please select at least one day.");
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

    const event = createEvent({
      title: title.trim() || "Busy",
      type,
      days: utc.days,
      startTime: utc.startTime,
      endTime: utc.endTime,
    });

    onAdd(event);

    setTitle("");
    setType("recurring");
    setDays([]);
    setStartTime("09:00");
    setEndTime("10:00");
  };

  const inputCls =
    "border-b-2 border-border bg-transparent px-1 py-2 text-sm outline-none transition-colors focus:border-maroon";

  return (
    <div className="mt-6 border-l-2 border-maroon pl-5">
      <div className="eyebrow mb-5 text-maroon">Add busy time</div>

      <div className="mb-5">
        <label className="eyebrow mb-2 block">Title</label>
        <input
          type="text"
          placeholder="e.g. Maths lecture"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`${inputCls} w-full`}
        />
      </div>

      <div className="mb-5">
        <label className="eyebrow mb-2 block">Type</label>
        <div className="inline-flex border border-border-mid">
          {(["recurring", "once"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`px-4 py-2 text-[13px] font-medium transition-colors ${
                type === t
                  ? "bg-maroon text-white"
                  : "bg-transparent text-text-2 hover:text-text"
              }`}
            >
              {t === "recurring" ? "Recurring" : "One-off"}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <label className="eyebrow mb-2 block">Days</label>
        <div className="flex gap-1.5">
          {DAYS.map((d, i) => (
            <button
              type="button"
              key={i}
              onClick={() => toggleDay(i)}
              className={`h-9 w-9 border font-mono text-[12px] font-medium transition-colors ${
                days.includes(i)
                  ? "border-maroon bg-maroon text-white"
                  : "border-border-mid bg-transparent text-text-2 hover:border-text"
              }`}
            >
              {d[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5 flex items-end gap-4">
        <div>
          <label className="eyebrow mb-2 block">From</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className={`${inputCls} font-mono`}
          />
        </div>
        <div>
          <label className="eyebrow mb-2 block">To</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className={`${inputCls} font-mono`}
          />
        </div>
        {overnight && <div className="eyebrow pb-2.5">ends next day</div>}
      </div>

      {error && <div className="mb-4 text-[13px] text-red">{error}</div>}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          className="bg-maroon px-5 py-2.5 font-mono text-[12px] uppercase tracking-[0.14em] text-white transition-colors hover:bg-maroon-dark active:scale-[0.98]"
        >
          Add
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-[13px] font-medium text-text-2 transition-colors hover:text-text"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
