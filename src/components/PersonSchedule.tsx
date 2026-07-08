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
    <div className="border border-border rounded-card p-4 bg-bg">
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="w-9 h-9 rounded-full bg-maroon text-white flex items-center justify-center text-[13px] font-semibold shrink-0">
          {initials(person.name)}
        </div>
        <input
          type="text"
          value={person.name}
          onChange={(e) => updatePerson(person.id, { name: e.target.value })}
          placeholder="Name"
          className="flex-1 min-w-[140px] max-w-[220px] border border-border-mid rounded-control px-3 py-2 text-sm outline-none focus:border-maroon bg-white"
        />
        <TimezonePicker
          label=""
          value={person.timezone}
          onChange={(tz) => updatePerson(person.id, { timezone: tz })}
        />
        {removable && (
          <button
            type="button"
            onClick={() => removePerson(person.id)}
            className="ml-auto inline-flex items-center gap-1.5 text-text-3 hover:text-red hover:bg-red-light rounded-md px-2 py-1 transition-colors text-[13px]"
            title="Remove person"
          >
            <IconTrash width={14} height={14} /> Remove
          </button>
        )}
      </div>

      <EventList
        timezone={person.timezone}
        events={person.events}
        onRemove={(eventId) => removeEvent(person.id, eventId)}
      />

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
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-control border border-border-mid bg-surface text-sm font-medium text-text hover:border-maroon/40 hover:bg-maroon-light/40 transition-all active:scale-[0.98]"
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
