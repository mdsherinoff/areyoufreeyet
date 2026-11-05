"use client";

import { useState } from "react";
import { BusyEvent, Person } from "@/types";
import { useSession } from "@/context/SessionContext";
import { convertEventDaysFromUTC } from "@/lib/timezone";
import { slotToTime } from "@/lib/time";
import { EventForm, EventDraft } from "./EventForm";
import { EventList } from "./EventList";
import { IcsImport } from "./IcsImport";
import { TimezonePicker } from "./TimezonePicker";
import { WeekStrip } from "./WeekStrip";
import { IconPlus, IconTrash } from "./Icons";

interface PersonScheduleProps {
  person: Person;
  /** Show a remove button (friends can be removed; you can't). */
  removable?: boolean;
}

type FormState =
  | { mode: "closed" }
  | { mode: "new"; initial?: Partial<EventDraft>; key: number }
  | { mode: "edit"; event: BusyEvent; initial: EventDraft };

export function PersonSchedule({
  person,
  removable,
}: PersonScheduleProps) {
  const {
    updatePerson,
    removePerson,
    addEvent,
    addEvents,
    updateEvent,
    removeEvent,
    notify,
  } = useSession();
  const [form, setForm] = useState<FormState>({ mode: "closed" });
  const close = () => setForm({ mode: "closed" });

  const startEdit = (ev: BusyEvent) => {
    const local = convertEventDaysFromUTC(
      ev.days,
      ev.startTime,
      ev.endTime,
      person.timezone,
    );
    setForm({
      mode: "edit",
      event: ev,
      initial: { title: ev.title, type: ev.type, ...local },
    });
  };

  // Clicking a spot on the week strip opens the form prefilled for that hour.
  const startAt = (day: number, slot: number) =>
    setForm({
      mode: "new",
      key: Date.now(),
      initial: {
        days: [day],
        startTime: slotToTime(slot),
        endTime: slotToTime((slot + 2) % 48),
      },
    });

  return (
    <div
      id={`person-${person.id}`}
      className="scroll-mt-6 border border-border bg-surface/60 p-5 shadow-card sm:p-6"
    >
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-maroon font-mono text-sm font-medium text-white">
          {initials(person.name)}
        </div>
        <input
          type="text"
          value={person.name}
          onChange={(e) => updatePerson(person.id, { name: e.target.value })}
          placeholder="Name"
          aria-label="Name"
          className="min-w-[120px] max-w-[240px] flex-1 border-b-2 border-transparent hover:border-border bg-transparent pb-1 font-display text-xl font-bold tracking-tight outline-none transition-colors focus:border-maroon"
        />
        <div className="ml-auto flex items-center gap-4">
          <TimezonePicker
            label=""
            value={person.timezone}
            onChange={(tz) => updatePerson(person.id, { timezone: tz })}
          />
          {removable && (
            <button
              type="button"
              onClick={() => removePerson(person.id)}
              className="inline-flex items-center gap-1.5 text-text-3 transition-colors hover:text-red"
              title="Remove person"
              aria-label={`Remove ${person.name || "person"}`}
            >
              <IconTrash width={15} height={15} />
              <span className="eyebrow">Remove</span>
            </button>
          )}
        </div>
      </div>

      <div className="mt-5">
        <WeekStrip person={person} onPick={startAt} />
      </div>

      <div className="mt-5">
        <EventList
          timezone={person.timezone}
          events={person.events}
          editingId={form.mode === "edit" ? form.event.id : undefined}
          onEdit={startEdit}
          onRemove={(eventId) => {
            if (form.mode === "edit" && form.event.id === eventId) close();
            removeEvent(person.id, eventId);
          }}
        />
      </div>

      {form.mode !== "closed" ? (
        <EventForm
          // Remount when switching between events so the fields reset.
          key={form.mode === "edit" ? form.event.id : `new-${form.key}`}
          timezone={person.timezone}
          initial={form.initial}
          editingId={form.mode === "edit" ? form.event.id : undefined}
          onSubmit={(event) => {
            if (form.mode === "edit") {
              updateEvent(person.id, event);
              notify(`Updated “${event.title}”`);
            } else {
              addEvent(person.id, event);
            }
            close();
          }}
          onCancel={close}
        />
      ) : (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setForm({ mode: "new", key: Date.now() })}
            className="inline-flex items-center gap-2 border border-text px-4 py-2 text-[13px] font-medium transition-colors hover:bg-maroon hover:border-maroon hover:text-white active:scale-[0.98]"
          >
            <IconPlus width={15} height={15} /> Add event
          </button>
          <IcsImport onImport={(events) => addEvents(person.id, events)} />
        </div>
      )}
    </div>
  );
}

function initials(name: string): string {
  return (
    (name || "?")
      .trim()
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}
