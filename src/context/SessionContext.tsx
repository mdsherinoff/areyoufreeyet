"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
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
  updateEvent: (personId: string, event: BusyEvent) => void;
  removeEvent: (personId: string, eventId: string) => void;
  shareUrl: () => string;
  /** Transient notice shown at the bottom of the screen. */
  toast: Toast | null;
  notify: (message: string) => void;
  dismissToast: () => void;
  /** Restore the session as it was before the last destructive action. */
  undo: () => void;
}

export interface Toast {
  id: number;
  message: string;
  undoable: boolean;
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
  const [toast, setToast] = useState<Toast | null>(null);
  const undoSnapshot = useRef<Session | null>(null);
  const toastSeq = useRef(0);

  const showToast = useCallback((message: string, undoable: boolean) => {
    toastSeq.current += 1;
    setToast({ id: toastSeq.current, message, undoable });
  }, []);

  const notify = useCallback(
    (message: string) => {
      undoSnapshot.current = null;
      showToast(message, false);
    },
    [showToast],
  );

  const dismissToast = useCallback(() => setToast(null), []);

  /** Remember the current session so a destructive change can be undone. */
  const withUndo = (message: string) => {
    undoSnapshot.current = session;
    showToast(message, true);
  };

  const undo = () => {
    const snap = undoSnapshot.current;
    if (!snap) return;
    undoSnapshot.current = null;
    setSession(snap);
    showToast("Restored", false);
  };

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
    const name = session.people.find((p) => p.id === personId)?.name;
    withUndo(`Removed ${name?.trim() || "friend"}`);
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

  const updateEvent = (personId: string, event: BusyEvent) => {
    setSession((prev) => ({
      ...prev,
      people: prev.people.map((p) =>
        p.id === personId
          ? {
              ...p,
              events: p.events.map((e) => (e.id === event.id ? event : e)),
            }
          : p,
      ),
    }));
  };

  const removeEvent = (personId: string, eventId: string) => {
    const title = session.people
      .find((p) => p.id === personId)
      ?.events.find((e) => e.id === eventId)?.title;
    withUndo(`Removed “${title || "event"}”`);
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
        updateEvent,
        removeEvent,
        shareUrl,
        toast,
        notify,
        dismissToast,
        undo,
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
