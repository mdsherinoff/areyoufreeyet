"use client";

import { useState } from "react";
import { useSession } from "@/context/SessionContext";
import { createPerson } from "@/lib/factory";
import { TimezonePicker } from "./TimezonePicker";
import { IconPlus } from "./Icons";

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
        className="inline-flex items-center gap-2 border border-text px-4 py-2 text-[13px] font-medium transition-colors hover:bg-maroon hover:border-maroon hover:text-white active:scale-[0.98]"
      >
        <IconPlus width={15} height={15} /> Add friend
      </button>
    );
  }

  return (
    <div className="flex w-full flex-wrap items-end gap-4 border-l-2 border-maroon pl-5">
      <div className="min-w-[160px] flex-1">
        <label className="eyebrow mb-2 block">Friend&apos;s name</label>
        <input
          type="text"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="e.g. Sam"
          className="w-full border-b-2 border-border bg-transparent px-1 py-2 text-sm outline-none transition-colors focus:border-maroon"
        />
      </div>
      <TimezonePicker label="TZ" value={timezone} onChange={setTimezone} />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={submit}
          className="bg-maroon px-5 py-2.5 font-mono text-[12px] uppercase tracking-[0.14em] text-white transition-colors hover:bg-maroon-dark active:scale-[0.98]"
        >
          Add
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[13px] font-medium text-text-2 transition-colors hover:text-text"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
