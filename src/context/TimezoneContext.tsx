"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { detectBrowserTimezone } from "@/lib/timezone";

interface TimezoneContextValue {
  timezone: string;
  setTimezone: (tz: string) => void;
}

const TimezoneContext = createContext<TimezoneContextValue | null>(null);

export function TimezoneProvider({ children }: { children: ReactNode }) {
  const [timezone, setTimezone] = useState<string>("UTC");

  // The browser's real timezone has no server-side equivalent, so we must
  // detect it client-side after mount. This is a recognized, intentional
  // exception to react-hooks/set-state-in-effect (React's own docs list
  // "isMounted/didMount"-style detection as a known legitimate case this
  // rule doesn't yet have a clean alternative for).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTimezone(detectBrowserTimezone());
  }, []);

  return (
    <TimezoneContext.Provider value={{ timezone, setTimezone }}>
      {children}
    </TimezoneContext.Provider>
  );
}

export function useTimezone() {
  const ctx = useContext(TimezoneContext);
  if (!ctx)
    throw new Error("useTimezone must be used within a TimezoneProvider");
  return ctx;
}
