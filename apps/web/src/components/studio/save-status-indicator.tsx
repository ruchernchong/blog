"use client";

import { Button } from "@heroui/react";
import { useEffect, useState } from "react";
import { formatRelativeTime, type SaveStatus } from "@/hooks/use-auto-save";

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  lastSavedAt: Date | null;
  onRetry?: () => void;
}

export function SaveStatusIndicator({
  status,
  lastSavedAt,
  onRetry,
}: SaveStatusIndicatorProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (status !== "saved" || !lastSavedAt) return;

    const interval = setInterval(() => setTick((t) => t + 1), 10_000);
    return () => clearInterval(interval);
  }, [status, lastSavedAt]);

  if (status === "idle") {
    return null;
  }

  return (
    <span className="text-muted text-sm">
      {status === "saving" && "Saving..."}
      {status === "saved" &&
        lastSavedAt &&
        `Saved ${formatRelativeTime(lastSavedAt)}`}
      {status === "error" && (
        <>
          Failed to save
          {onRetry && (
            <Button
              variant="ghost"
              size="sm"
              onPress={onRetry}
              className="ml-1 h-auto px-1 py-0 text-accent underline hover:no-underline"
            >
              Retry
            </Button>
          )}
        </>
      )}
      {status === "offline" && "Offline — changes pending"}
    </span>
  );
}
