"use client";

import { useState } from "react";
import { useSession } from "@/context/SessionContext";
import { IconLink, IconCheck } from "./Icons";

export function ShareButton() {
  const { shareUrl } = useSession();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = shareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
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
      title="Copy a link that adds everyone's schedule for a friend"
    >
      {copied ? (
        <>
          <IconCheck width={15} height={15} /> Copied
        </>
      ) : (
        <>
          <IconLink width={15} height={15} /> Share
        </>
      )}
    </button>
  );
}
