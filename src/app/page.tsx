"use client";

import { useState } from "react";
import { useSession } from "@/context/SessionContext";
import { EventForm } from "@/components/EventForm";
import { EventList } from "@/components/EventList";
import { TimezoneSelector } from "@/components/TimezoneSelector";

export default function Home() {
  const { session, updatePerson, addEvent, removeEvent } = useSession();
  const [showForm, setShowForm] = useState(false);
  const you = session.people[0];

  return (
    <div className="max-w-[780px] mx-auto px-5 py-8 pb-16">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-10">
        <div className="text-[22px] font-medium tracking-tight">
          Are<span className="text-green">You</span>FreeYet
          <span className="inline-block w-[7px] h-[7px] bg-green rounded-full ml-px relative -top-0.5" />
        </div>
        <TimezoneSelector />
      </div>

      {/* Steps */}
      <div className="flex bg-surface border border-border rounded-card p-1 mb-8">
        <button className="flex-1 py-2 px-1.5 rounded-[9px] text-[13px] flex items-center justify-center gap-1.5 bg-green text-white font-medium">
          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] bg-white/20">
            1
          </span>
          Your schedule
        </button>
        <button className="flex-1 py-2 px-1.5 rounded-[9px] text-[13px] flex items-center justify-center gap-1.5 text-text-3">
          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] bg-black/[0.06]">
            2
          </span>
          Friends
        </button>
        <button className="flex-1 py-2 px-1.5 rounded-[9px] text-[13px] flex items-center justify-center gap-1.5 text-text-3">
          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] bg-black/[0.06]">
            3
          </span>
          Results
        </button>
      </div>

      {/* Card */}
      <div className="bg-surface border border-border rounded-card p-6 mb-4 shadow-card">
        <div className="text-base font-medium mb-1">Your schedule</div>
        <div className="text-[13px] text-text-2 mb-5">
          Add your classes and commitments.
        </div>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-full bg-green-light text-green-dark flex items-center justify-center text-[13px] font-medium">
            {initials(you.name)}
          </div>
          <input
            type="text"
            value={you.name}
            onChange={(e) => updatePerson(you.id, { name: e.target.value })}
            placeholder="Your name"
            className="max-w-[220px] border border-border-mid rounded-control px-3 py-2 text-sm outline-none focus:border-green"
          />
        </div>

        <EventList
          events={you.events}
          onRemove={(eventId) => removeEvent(you.id, eventId)}
        />

        {showForm ? (
          <EventForm
            onAdd={(event) => {
              addEvent(you.id, event);
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-control border border-border-mid bg-surface text-sm hover:bg-bg transition-colors"
          >
            + Add event
          </button>
        )}
      </div>

      <div className="flex justify-end">
        <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-control bg-green text-white font-medium text-sm hover:bg-green-dark transition-colors">
          Add friends →
        </button>
      </div>
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
