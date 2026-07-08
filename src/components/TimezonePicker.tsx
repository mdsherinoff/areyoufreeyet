"use client";

import { COMMON_TIMEZONES, tzLabel } from "@/lib/timezone";

interface TimezonePickerProps {
  value: string;
  onChange: (tz: string) => void;
  label?: string;
  className?: string;
}

export function TimezonePicker({
  value,
  onChange,
  label = "Timezone",
  className = "",
}: TimezonePickerProps) {
  return (
    <label className={`text-sm flex items-center gap-2 ${className}`}>
      {label && <span className="text-text-2 text-xs">{label}</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-border-mid rounded-control px-2.5 py-1.5 text-sm bg-white outline-none focus:border-green"
      >
        {/* Keep an unlisted tz (e.g. detected or from a shared link) selectable. */}
        {value && !COMMON_TIMEZONES.includes(value) && (
          <option value={value}>{tzLabel(value)}</option>
        )}
        {COMMON_TIMEZONES.map((tz) => (
          <option key={tz} value={tz}>
            {tzLabel(tz)}
          </option>
        ))}
      </select>
    </label>
  );
}
