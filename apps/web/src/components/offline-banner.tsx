"use client";

import { useOffline } from "next/offline";

export function OfflineBanner() {
  const isOffline = useOffline();

  if (!isOffline) {
    return null;
  }

  return (
    <div
      role="status"
      className="sticky top-0 z-50 border-border border-b bg-muted/90 px-4 py-2 text-center text-foreground text-sm backdrop-blur-sm"
    >
      You&apos;re offline. Cached pages still work; new content will load when
      you&apos;re back online.
    </div>
  );
}
