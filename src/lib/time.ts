export const SLOT_MINS = 30;
export const SLOTS_PER_DAY = 48;
export const DAY_START_MINS = 0;

export function timeToMins(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function minsToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function slotIndex(timeStr: string): number {
  const m = timeToMins(timeStr) - DAY_START_MINS;
  return Math.max(0, Math.min(SLOTS_PER_DAY - 1, Math.floor(m / SLOT_MINS)));
}

export function slotToTime(slot: number): string {
  return minsToTime(DAY_START_MINS + slot * SLOT_MINS);
}

export function formatHourLabel(h: number, m = 0): string {
  const ampm = h < 12 ? "am" : "pm";
  const hh = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0
    ? `${hh}${ampm}`
    : `${hh}:${String(m).padStart(2, "0")}${ampm}`;
}

export function formatTimeStr(t: string): string {
  const [h, m] = t.split(":").map(Number);
  return formatHourLabel(h, m);
}

export function durationLabel(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}
