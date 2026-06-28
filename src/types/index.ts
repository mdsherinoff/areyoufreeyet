export interface BusyEvent {
  id: string;
  title: string;
  type: "recurring" | "once";
  days: number[]; // 0=Mon ... 6=Sun
  startTime: string; // "HH:MM" 24hr
  endTime: string; // "HH:MM" 24hr
}

export interface Person {
  id: string;
  name: string;
  events: BusyEvent[];
}

export interface Session {
  sessionId: string;
  people: Person[];
}
