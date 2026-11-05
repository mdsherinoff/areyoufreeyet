"use client";

import { useEffect, useRef, useState } from "react";
import { parseICS } from "@/lib/icsImport";
import { BusyEvent } from "@/types";
import { IconUpload } from "./Icons";

interface IcsImportProps {
  onImport: (events: BusyEvent[]) => void;
}

export function IcsImport({ onImport }: IcsImportProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{
    text: string;
    tone: "busy" | "ok" | "error";
  } | null>(null);

  // Let the result linger briefly, then get out of the way.
  useEffect(() => {
    if (!status || status.tone === "busy") return;
    const t = setTimeout(() => setStatus(null), 6000);
    return () => clearTimeout(t);
  }, [status]);

  const handleFile = async (file: File) => {
    setStatus({ text: "Reading…", tone: "busy" });
    try {
      const text = await file.text();
      const { events, skippedCount } = parseICS(text);
      if (events.length === 0) {
        setStatus({ text: "No events found in that file", tone: "error" });
        return;
      }
      onImport(events);
      setStatus({
        text:
          `Imported ${events.length} event${events.length === 1 ? "" : "s"}` +
          (skippedCount ? ` · skipped ${skippedCount}` : ""),
        tone: "ok",
      });
    } catch {
      setStatus({ text: "Couldn't read that file", tone: "error" });
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
        title="Import a .ics export from Google Calendar, Outlook or Apple Calendar"
      >
        <IconUpload width={15} height={15} /> Import .ics
      </button>
      {status && (
        <span
          role="status"
          className={`eyebrow ${
            status.tone === "error" ? "text-red" : status.tone === "ok" ? "text-maroon" : ""
          }`}
        >
          {status.text}
        </span>
      )}
    </div>
  );
}
