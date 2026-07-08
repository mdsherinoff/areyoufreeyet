"use client";

import { useState } from "react";
import { useSession } from "@/context/SessionContext";
import { createPerson } from "@/lib/factory";
import { TimezonePicker } from "./TimezonePicker";

interface AddFriendProps {
  /** Default timezone for a new friend (usually your own). */
  defaultTimezone: string;
}

export function AddFriend({ defaultTimezone }: AddFriendProps) {
  const { addPerson } = useSession();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState(defaultTimezone);

  const submit = () => {
    addPerson(createPerson(name.trim() || "Friend", timezone));
    setName("");
    setTimezone(defaultTimezone);
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-control border border-border-mid bg-surface text-sm hover:bg-bg transition-colors"
      >
        + Add friend
      </button>
    );
  }

  return (
    <div className="border border-border rounded-card p-4 bg-bg flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-[160px]">
        <label className="text-xs text-text-2 block mb-1">Friend&apos;s name</label>
        <input
          type="text"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="e.g. Sam"
          className="w-full border border-border-mid rounded-control px-3 py-2 text-sm outline-none focus:border-green bg-white"
        />
      </div>
      <TimezonePicker label="" value={timezone} onChange={setTimezone} />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2 rounded-control border border-border-mid bg-white text-sm hover:bg-bg transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          className="px-4 py-2 rounded-control bg-green text-white text-sm font-medium hover:bg-green-dark transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}
