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
    <label className={`flex items-center gap-2 ${className}`}>
      {label && <span className="eyebrow">{label}</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer border-b-2 border-border bg-transparent py-1 font-mono text-[12px] uppercase tracking-[0.08em] outline-none transition-colors hover:border-border-mid focus:border-maroon"
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
