"use client";

import { useState } from "react";
import { useSession } from "@/context/SessionContext";

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
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-control border border-border-mid bg-surface text-sm hover:bg-bg transition-colors"
      title="Copy a link that adds everyone's schedule for a friend"
    >
      {copied ? "✓ Link copied" : "🔗 Share link"}
    </button>
  );
}
