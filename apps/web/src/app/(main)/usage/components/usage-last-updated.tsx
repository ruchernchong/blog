import { Skeleton } from "@heroui/react";
import { Suspense } from "react";
import { Typography } from "@/components/typography";
import { LastUpdatedClient } from "./last-updated.client";

interface UsageLastUpdatedProps {
  date: string;
}

export function UsageLastUpdated({ date }: UsageLastUpdatedProps) {
  return (
    <Typography as="span" className="text-muted" variant="body-sm">
      Last updated{" "}
      <Suspense fallback={<UsageLastUpdatedFallback />}>
        <LastUpdatedClient date={date} />
      </Suspense>
    </Typography>
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
