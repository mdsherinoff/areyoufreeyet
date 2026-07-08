"use client";

import { useState } from "react";
import { Person } from "@/types";
import { useSession } from "@/context/SessionContext";
import { EventForm } from "./EventForm";
import { EventList } from "./EventList";
import { IcsImport } from "./IcsImport";
import { TimezonePicker } from "./TimezonePicker";
import { IconPlus, IconTrash } from "./Icons";

interface PersonScheduleProps {
  person: Person;
  /** Show a remove button (friends can be removed; you can't). */
  removable?: boolean;
}

export function PersonSchedule({ person, removable }: PersonScheduleProps) {
  const { updatePerson, removePerson, addEvent, addEvents, removeEvent } =
    useSession();
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-maroon font-mono text-sm font-medium text-white">
          {initials(person.name)}
        </div>
        <input
          type="text"
          value={person.name}
          onChange={(e) => updatePerson(person.id, { name: e.target.value })}
          placeholder="Name"
          className="min-w-[120px] max-w-[240px] flex-1 border-b-2 border-border bg-transparent pb-1 font-display text-xl font-bold tracking-tight outline-none transition-colors focus:border-maroon"
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
            >
              <IconTrash width={15} height={15} />
              <span className="eyebrow">Remove</span>
            </button>
          )}
        </div>
      </div>

      <div className="mt-5">
        <EventList
          timezone={person.timezone}
          events={person.events}
          onRemove={(eventId) => removeEvent(person.id, eventId)}
        />
      </div>

      {showForm ? (
        <EventForm
          timezone={person.timezone}
          onAdd={(event) => {
            addEvent(person.id, event);
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowForm(true)}
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
