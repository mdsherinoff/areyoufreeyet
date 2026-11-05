"use client";

import { useEffect } from "react";
import { useSession } from "@/context/SessionContext";
import { IconClose } from "./Icons";

const TIMEOUT_MS = 5000;

/** Bottom-of-screen notice, with an Undo action after destructive changes. */
export function Toaster() {
  const { toast, dismissToast, undo } = useSession();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(dismissToast, toast.undoable ? TIMEOUT_MS + 2000 : TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [toast, dismissToast]);

  // Cmd/Ctrl+Z undoes the last removal while its toast is up — but never
  // steals undo from a text field the user is typing in.
  useEffect(() => {
    if (!toast?.undoable) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing =
        el?.tagName === "INPUT" || el?.tagName === "TEXTAREA" || el?.isContentEditable;
      if (!typing && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toast, undo]);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      {toast && (
        <div
          key={toast.id}
          role="status"
          className="toast-in pointer-events-auto flex max-w-full items-center gap-4 bg-text py-2.5 pl-4 pr-2 text-[13px] text-white shadow-pop"
        >
          <span className="truncate">{toast.message}</span>
          {toast.undoable && (
            <button
              type="button"
              onClick={undo}
              className="shrink-0 font-mono text-[12px] uppercase tracking-[0.14em] text-[#f1b9c8] underline-offset-4 hover:underline"
            >
              Undo
            </button>
          )}
          <button
            type="button"
            onClick={dismissToast}
            aria-label="Dismiss"
            className="shrink-0 p-1 text-white/60 transition-colors hover:text-white"
          >
            <IconClose width={14} height={14} />
          </button>
        </div>
      )}
    </div>
  );
}
