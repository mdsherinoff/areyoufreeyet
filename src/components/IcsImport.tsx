"use client";

import { useRef, useState } from "react";
import { parseICS } from "@/lib/icsImport";
import { BusyEvent } from "@/types";
import { IconUpload } from "./Icons";

interface IcsImportProps {
  onImport: (events: BusyEvent[]) => void;
}

export function IcsImport({ onImport }: IcsImportProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setStatus("Reading…");
    try {
      const text = await file.text();
      const { events, skippedCount } = parseICS(text);
      if (events.length === 0) {
        setStatus("No events found in that file.");
        return;
      }
      onImport(events);
      setStatus(
        `Imported ${events.length} event${events.length === 1 ? "" : "s"}` +
          (skippedCount ? ` · skipped ${skippedCount}` : ""),
      );
    } catch {
      setStatus("Couldn't read that file.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept=".ics,text/calendar"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-2 border border-text px-4 py-2 text-[13px] font-medium transition-colors hover:bg-maroon hover:border-maroon hover:text-white active:scale-[0.98]"
        title="Import a .ics calendar export"
      >
        <IconUpload width={15} height={15} /> Import .ics
      </button>
      {status && <span className="eyebrow">{status}</span>}
    </div>
  );
}
