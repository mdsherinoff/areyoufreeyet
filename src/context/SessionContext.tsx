"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Session, Person, BusyEvent } from "@/types";
import { createSession, createPerson } from "@/lib/factory";

interface SessionContextValue {
  session: Session;
  addPerson: (person: Person) => void;
  updatePerson: (personId: string, updates: Partial<Person>) => void;
  removePerson: (personId: string) => void;
  addEvent: (personId: string, event: BusyEvent) => void;
  removeEvent: (personId: string, eventId: string) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(() =>
    createSession([createPerson("Me")]),
  );

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

  return (
    <SessionContext.Provider
      value={{
        session,
        addPerson,
        updatePerson,
        removePerson,
        addEvent,
        removeEvent,
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
