"use client";

import { useRef, useState } from "react";
import { parseICS } from "@/lib/icsImport";
import { BusyEvent } from "@/types";

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
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-control border border-border-mid bg-surface text-sm hover:bg-bg transition-colors"
        title="Import a .ics calendar export"
      >
        ↥ Import .ics
      </button>
      {status && <span className="text-xs text-text-3">{status}</span>}
    </div>
  );
}
