import { Person } from "@/types";
import { slotIndex, SLOTS_PER_DAY, SLOT_MINS, timeToMins } from "./time";

export type BusyMatrix = boolean[][]; // [day][slot]

export function buildBusyMatrix(person: Person): BusyMatrix {
  const matrix: BusyMatrix = Array.from({ length: 7 }, () =>
    Array(SLOTS_PER_DAY).fill(false),
  );

  for (const event of person.events) {
    const startMins = timeToMins(event.startTime);
    const endMins = timeToMins(event.endTime);
    const overnight = endMins <= startMins;

    for (const day of event.days) {
      if (!overnight) {
        const startSlot = slotIndex(event.startTime);
        const endSlot = slotIndex(event.endTime);
        for (let s = startSlot; s < endSlot && s < SLOTS_PER_DAY; s++) {
          matrix[day][s] = true;
        }
      } else {
        // Event crosses midnight: split into two segments.
        // Segment 1: startTime -> end of this day.
        const startSlot = slotIndex(event.startTime);
        for (let s = startSlot; s < SLOTS_PER_DAY; s++) {
          matrix[day][s] = true;
        }
        // Segment 2: start of next day -> endTime.
        const nextDay = (day + 1) % 7;
        const endSlot = slotIndex(event.endTime);
        for (let s = 0; s < endSlot; s++) {
          matrix[nextDay][s] = true;
        }
      }
    }
  }

  return matrix;
}

export interface FreeWindow {
  day: number; // 0=Mon ... 6=Sun
  startSlot: number;
  endSlot: number; // inclusive
  durationMins: number;
}

export type DayFilter = "all" | "weekday" | "weekend";

export function isDayVisible(day: number, filter: DayFilter): boolean {
  if (filter === "weekday") return day < 5;
  if (filter === "weekend") return day >= 5;
  return true;
}

/**
 * Given everyone's busy matrices, find contiguous blocks where
 * ALL people are free, of at least `minBlockHours` long.
 */
export function findFreeWindows(
  matrices: BusyMatrix[],
  minBlockHours: number,
  dayFilter: DayFilter = "all",
): FreeWindow[] {
  if (matrices.length === 0) return [];

  const windows: FreeWindow[] = [];
  const minSlots = (minBlockHours * 60) / SLOT_MINS;

  for (let day = 0; day < 7; day++) {
    if (!isDayVisible(day, dayFilter)) continue;

    let start = -1;
    let len = 0;

    // Iterate one past the last slot so a block running to end-of-day is
    // flushed. NOTE: each matrix is [day][slot], so the slot count is
    // SLOTS_PER_DAY -- not matrices[0].length (which is the day count, 7).
    for (let slot = 0; slot <= SLOTS_PER_DAY; slot++) {
      const allFree =
        slot < SLOTS_PER_DAY && matrices.every((m) => !m[day][slot]);

      if (allFree) {
        if (start < 0) start = slot;
        len++;
      } else {
        if (start >= 0 && len >= minSlots) {
          windows.push({
            day,
            startSlot: start,
            endSlot: start + len - 1,
            durationMins: len * SLOT_MINS,
          });
        }
        start = -1;
        len = 0;
      }
    }
  }

  return windows;
}

/**
 * For each [day][slot], count how many people are free. Used to render the
 * overlap heatmap. A slot with count === matrices.length means everyone is
 * free at that time.
 */
export function buildFreeCounts(matrices: BusyMatrix[]): number[][] {
  return Array.from({ length: 7 }, (_, day) =>
    Array.from({ length: SLOTS_PER_DAY }, (_, slot) =>
      matrices.reduce((n, m) => n + (m[day][slot] ? 0 : 1), 0),
    ),
  );
}
