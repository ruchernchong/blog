import { Skeleton } from "@heroui/react";
import { Suspense } from "react";
import { LastUpdatedClient } from "./last-updated.client";

interface UsageLastUpdatedProps {
  date: string;
}

export function UsageLastUpdated({ date }: UsageLastUpdatedProps) {
  return (
    <Suspense fallback={<UsageLastUpdatedFallback />}>
      <LastUpdatedClient date={date} />
    </Suspense>
  );
}

export function UsageLastUpdatedFallback() {
  return (
    <div role="status" aria-label="Loading usage update time">
      <Skeleton aria-hidden="true" className="h-4 w-36 rounded-lg" />
    </div>
  );
}
