import { deflate, inflate } from "pako";
import { Session } from "@/types";

/**
 * Encode a Session into a URL-safe string: JSON -> compress -> base64.
 */
export function encodeSession(session: Session): string {
  const json = JSON.stringify(session);
  const compressed = deflate(json);
  const base64 = bytesToBase64(compressed);
  return toUrlSafe(base64);
}

/**
 * Decode a URL-safe string back into a Session: base64 -> decompress -> JSON.
 * Returns null if the string is invalid/corrupted, rather than throwing.
 */
export function decodeSession(encoded: string): Session | null {
  try {
    const base64 = fromUrlSafe(encoded);
    const bytes = base64ToBytes(base64);
    const json = inflate(bytes, { toText: true });
    return JSON.parse(json) as Session;
  } catch {
    return null;
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function toUrlSafe(base64: string): string {
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromUrlSafe(urlSafe: string): string {
  let base64 = urlSafe.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  return base64;
}
