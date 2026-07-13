import { Skeleton } from "@heroui/react";
import { Suspense } from "react";
import { LastUpdatedClient } from "./last-updated.client";

interface UsageLastUpdatedProps {
  date: string;
}

export function UsageLastUpdated({ date }: UsageLastUpdatedProps) {
  return (
    <span className="shrink-0 font-mono text-muted text-sm">
      Last updated{" "}
      <Suspense fallback={<UsageLastUpdatedFallback />}>
        <LastUpdatedClient date={date} />
      </Suspense>
    </span>
  );
}

export function UsageLastUpdatedFallback() {
  return (
    <Skeleton
      role="status"
      aria-label="Loading usage update time"
      className="inline-block h-4 w-36 rounded-lg align-middle"
    />
  );
}
