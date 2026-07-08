"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Session, Person, BusyEvent } from "@/types";
import { createSession, createPerson } from "@/lib/factory";
import { detectBrowserTimezone } from "@/lib/timezone";
import {
  loadStoredSession,
  saveStoredSession,
  loadSessionFromHash,
  buildShareUrl,
  clearHash,
} from "@/lib/session";

interface SessionContextValue {
  session: Session;
  /** True once the real session has been loaded on the client. */
  ready: boolean;
  /** True when this session was just opened from a shared link. */
  joinedFromLink: boolean;
  addPerson: (person: Person) => void;
  updatePerson: (personId: string, updates: Partial<Person>) => void;
  removePerson: (personId: string) => void;
  addEvent: (personId: string, event: BusyEvent) => void;
  addEvents: (personId: string, events: BusyEvent[]) => void;
  removeEvent: (personId: string, eventId: string) => void;
  shareUrl: () => string;
}

const SessionContext = createContext<SessionContextValue | null>(null);

// Stable placeholder rendered until the client-side load runs. It never
// reaches the user (the app gates on `ready`) but keeps `session` non-null
// so consumers don't need null checks everywhere.
const PLACEHOLDER: Session = { sessionId: "", people: [] };

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(PLACEHOLDER);
  const [ready, setReady] = useState(false);
  const [joinedFromLink, setJoinedFromLink] = useState(false);

  // Load order (client only): shared link > saved draft > fresh session.
  // Must run in an effect: it reads browser-only APIs (localStorage, location,
  // Intl timezone, crypto.randomUUID) that have no server equivalent, so doing
  // it in a useState initializer would produce a hydration mismatch. This is
  // the recognized "didMount initialization" exception to set-state-in-effect
  // (the same one TimezoneContext previously documented).
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const fromHash = loadSessionFromHash();
    if (fromHash) {
      setSession(fromHash);
      setJoinedFromLink(true);
      clearHash(); // don't leave a stale payload in the address bar
    } else {
      const stored = loadStoredSession();
      setSession(
        stored ?? createSession([createPerson("Me", detectBrowserTimezone())]),
      );
    }
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Auto-save the draft whenever it changes. We also save right after the
  // initial load: harmless when it came from localStorage, and essential when
  // it came from a share link (we clear the hash, so localStorage becomes the
  // only copy that survives a refresh).
  useEffect(() => {
    if (!ready) return;
    saveStoredSession(session);
  }, [session, ready]);

  const addPerson = (person: Person) => {
    setSession((prev) => ({ ...prev, people: [...prev.people, person] }));
  };

  const updatePerson = (personId: string, updates: Partial<Person>) => {
    setSession((prev) => ({
      ...prev,
      people: prev.people.map((p) =>
        p.id === personId ? { ...p, ...updates } : p,
      ),
    }));
  };

  const removePerson = (personId: string) => {
    setSession((prev) => ({
      ...prev,
      people: prev.people.filter((p) => p.id !== personId),
    }));
  };

  const addEvent = (personId: string, event: BusyEvent) => {
    setSession((prev) => ({
      ...prev,
      people: prev.people.map((p) =>
        p.id === personId ? { ...p, events: [...p.events, event] } : p,
      ),
    }));
  };

  const addEvents = (personId: string, events: BusyEvent[]) => {
    setSession((prev) => ({
      ...prev,
      people: prev.people.map((p) =>
        p.id === personId ? { ...p, events: [...p.events, ...events] } : p,
      ),
    }));
  };

  const removeEvent = (personId: string, eventId: string) => {
    setSession((prev) => ({
      ...prev,
      people: prev.people.map((p) =>
        p.id === personId
          ? { ...p, events: p.events.filter((e) => e.id !== eventId) }
          : p,
      ),
    }));
  };

  const shareUrl = () => buildShareUrl(session);

  return (
    <SessionContext.Provider
      value={{
        session,
        ready,
        joinedFromLink,
        addPerson,
        updatePerson,
        removePerson,
        addEvent,
        addEvents,
        removeEvent,
        shareUrl,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within a SessionProvider");
  return ctx;
}
