import { BusyEvent, Person, Session } from "@/types";

export function createEvent(partial: Omit<BusyEvent, "id">): BusyEvent {
  return { id: crypto.randomUUID(), ...partial };
}

export function createPerson(
  name: string,
  timezone: string,
  events: BusyEvent[] = [],
): Person {
  return { id: crypto.randomUUID(), name, timezone, events };
}

export function createSession(people: Person[] = []): Session {
  return { sessionId: crypto.randomUUID(), people };
}
