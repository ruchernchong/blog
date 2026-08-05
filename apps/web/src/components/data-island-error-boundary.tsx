"use client";

import { Button } from "@heroui/react";
import { catchError, type ErrorInfo } from "next/error";
import { useEffect } from "react";
import { ERROR_IDS } from "@/constants/error-ids";
import { logError } from "@/lib/logger";

type DataIslandErrorFallbackProps = {
  label?: string;
};

function DataIslandErrorPanel({
  label,
  error,
  retry,
}: {
  label: string;
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    logError(ERROR_IDS.DATA_ISLAND_ERROR, error, { label });
  }, [error, label]);

  const message =
    error instanceof Error && error.message
      ? error.message
      : "Something went wrong while loading this data.";

  return (
    <div
      role="alert"
      className="flex flex-col gap-4 rounded-2xl border border-border border-dashed bg-muted/40 p-6"
    >
      <div className="flex flex-col gap-2">
        <p className="font-medium text-foreground text-sm tracking-tight">
          {label} couldn&apos;t load
        </p>
        <p className="text-muted text-sm">{message}</p>
      </div>
      <div>
        <Button size="sm" variant="outline" onPress={() => retry()}>
          Try again
        </Button>
      </div>
    </div>
  );
}

function DataIslandErrorFallback(
  { label = "This section" }: DataIslandErrorFallbackProps,
  { error, retry }: ErrorInfo,
) {
  return <DataIslandErrorPanel label={label} error={error} retry={retry} />;
}

export const DataIslandErrorBoundary = catchError(DataIslandErrorFallback);
