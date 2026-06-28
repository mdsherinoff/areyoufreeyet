"use client";

import { useTimezone } from "@/context/TimezoneContext";
import { COMMON_TIMEZONES } from "@/lib/timezone";

export function TimezoneSelector() {
  const { timezone, setTimezone } = useTimezone();

  return (
    <label className="text-sm flex items-center gap-2">
      <span className="text-text-2 text-xs">Timezone</span>
      <select
        value={timezone}
        onChange={(e) => setTimezone(e.target.value)}
        className="border border-border-mid rounded-control px-2.5 py-1.5 text-sm bg-white outline-none focus:border-green"
      >
        {!COMMON_TIMEZONES.includes(timezone) && (
          <option value={timezone}>{timezone}</option>
        )}
        {COMMON_TIMEZONES.map((tz) => (
          <option key={tz} value={tz}>
            {tz.replace("_", " ")}
          </option>
        ))}
      </select>
    </label>
  );
}
