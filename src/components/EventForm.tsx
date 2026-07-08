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

  return (
    <div className="border border-border rounded-card p-4 mt-4 bg-bg">
      <div className="text-sm font-medium mb-4">Add busy time</div>

      <div className="mb-3">
        <label className="text-xs text-text-2 block mb-1">Title</label>
        <input
          type="text"
          placeholder="e.g. Maths lecture"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-border-mid rounded-control px-3 py-2 text-sm outline-none focus:border-green bg-white"
        />
      </div>

      <div className="mb-3">
        <label className="text-xs text-text-2 block mb-1">Type</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setType("recurring")}
            className={`flex-1 py-2 rounded-control text-sm border transition-colors ${
              type === "recurring"
                ? "bg-green text-white border-green"
                : "bg-white border-border-mid text-text-2"
            }`}
          >
            Recurring
          </button>
          <button
            type="button"
            onClick={() => setType("once")}
            className={`flex-1 py-2 rounded-control text-sm border transition-colors ${
              type === "once"
                ? "bg-green text-white border-green"
                : "bg-white border-border-mid text-text-2"
            }`}
          >
            One-off
          </button>
        </div>
      </div>

      <div className="mb-3">
        <label className="text-xs text-text-2 block mb-1">Days</label>
        <div className="flex gap-1.5">
          {DAYS.map((d, i) => (
            <button
              type="button"
              key={i}
              onClick={() => toggleDay(i)}
              className={`w-9 h-9 rounded-full text-xs font-medium border transition-colors ${
                days.includes(i)
                  ? "bg-green text-white border-green"
                  : "bg-white border-border-mid text-text-2"
              }`}
            >
              {d.slice(0, 1)}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 flex items-end gap-2">
        <div>
          <label className="text-xs text-text-2 block mb-1">From</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="border border-border-mid rounded-control px-3 py-2 text-sm outline-none focus:border-green bg-white"
          />
        </div>
        <div>
          <label className="text-xs text-text-2 block mb-1">To</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="border border-border-mid rounded-control px-3 py-2 text-sm outline-none focus:border-green bg-white"
          />
        </div>
        {overnight && (
          <div className="text-xs text-text-3 pb-2.5">ends next day</div>
        )}
      </div>

      {error && <div className="text-red text-sm mb-3">{error}</div>}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-control border border-border-mid bg-white text-sm hover:bg-bg transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="px-4 py-2 rounded-control bg-green text-white text-sm font-medium hover:bg-green-dark transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}
