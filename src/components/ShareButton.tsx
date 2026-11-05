"use client";

import { useState } from "react";
import { useSession } from "@/context/SessionContext";
import { IconLink, IconCheck } from "./Icons";

interface ShareButtonProps {
  label?: string;
}

export function ShareButton({ label = "Share" }: ShareButtonProps) {
  const { shareUrl, notify } = useSession();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = shareUrl();

    // On phones, hand off to the native share sheet (Messages, WhatsApp…).
    const touch =
      typeof window !== "undefined" &&
      window.matchMedia?.("(pointer: coarse)").matches;
    if (touch && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "AreYouFreeYet",
          text: "Add your schedule so we can find a time:",
          url,
        });
        return;
      } catch (err) {
        // User dismissed the sheet — nothing to do.
        if ((err as DOMException)?.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      notify("Link copied — anyone who opens it can add their schedule");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (insecure context / permissions): fall back to a
      // prompt so the user can still copy the link manually.
      window.prompt("Copy this link to share:", url);
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`inline-flex items-center gap-2 border px-4 py-2 font-mono text-[12px] uppercase tracking-[0.12em] transition-all active:scale-[0.98] ${
        copied
          ? "border-maroon bg-maroon text-white"
          : "border-text text-text hover:bg-maroon hover:border-maroon hover:text-white"
      }`}
      title="Copy a link with everyone's schedule so friends can add theirs"
    >
      {copied ? (
        <>
          <IconCheck width={15} height={15} /> Copied
        </>
      ) : (
        <>
          <IconLink width={15} height={15} /> {label}
        </>
      )}
    </button>
  );
}
