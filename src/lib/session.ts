import { Person, Session } from "@/types";
import { encodeSession, decodeSession } from "./share";
import { convertEventDaysFromUTC } from "./timezone";

const STORAGE_KEY = "areyoufreeyet:session";
const HASH_PREFIX = "#s=";

/**
 * Re-express a person's UTC-anchored events as wall-clock events in `tz`.
 * The returned person can be fed to buildBusyMatrix to get a busy matrix
 * whose days/slots are already in the target timezone -- so the whole
 * results grid can be computed and rendered in one consistent zone.
 */
export function localizePerson(person: Person, tz: string): Person {
  return {
    ...person,
    events: person.events.map((ev) => {
      const local = convertEventDaysFromUTC(
        ev.days,
        ev.startTime,
        ev.endTime,
        tz,
      );
      return {
        ...ev,
        days: local.days,
        startTime: local.startTime,
        endTime: local.endTime,
      };
    }),
  };
}

// ─── localStorage (auto-save of the working draft) ──────────────────────

export function loadStoredSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalizeSession(JSON.parse(raw) as Session);
  } catch {
    return null;
  }
}

export function saveStoredSession(session: Session): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Quota / privacy-mode failures are non-fatal -- the app still works
    // in-memory, we just can't persist across reloads.
  }
}

// ─── URL hash (share / join a group) ────────────────────────────────────

/** Read a shared session from the current URL hash, if present. */
export function loadSessionFromHash(): Session | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash;
  if (!hash.startsWith(HASH_PREFIX)) return null;
  const decoded = decodeSession(hash.slice(HASH_PREFIX.length));
  return decoded ? normalizeSession(decoded) : null;
}

/** Build a full shareable URL that encodes the given session in its hash. */
export function buildShareUrl(session: Session): string {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}${HASH_PREFIX}${encodeSession(session)}`;
}

/** Remove the #s=... payload from the address bar without a reload. */
export function clearHash(): void {
  if (typeof window === "undefined") return;
  const { origin, pathname, search } = window.location;
  window.history.replaceState(null, "", `${origin}${pathname}${search}`);
}

/**
 * Defensive normalization for sessions coming from an untrusted source
 * (localStorage written by an older build, or a hand-edited share link):
 * guarantee the shape our components rely on.
 */
function normalizeSession(session: Session): Session {
  return {
    sessionId: session.sessionId ?? crypto.randomUUID(),
    people: (session.people ?? []).map((p) => ({
      id: p.id ?? crypto.randomUUID(),
      name: p.name ?? "",
      timezone: p.timezone || "UTC",
      events: Array.isArray(p.events) ? p.events : [],
    })),
  };
}
