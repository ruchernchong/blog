"use client";

import { Button } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import Link from "next/link";
import { useEffect } from "react";
import { ERROR_IDS } from "@/constants/error-ids";
import { logError } from "@/lib/logger";

export default function StudioError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    logError(ERROR_IDS.ROUTE_SEGMENT_ERROR, error, {
      digest: error.digest,
      scope: "studio",
    });
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 px-4 py-12">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="font-medium text-foreground text-lg tracking-tight">
          Studio hit a snag
        </p>
        <p className="max-w-sm text-muted text-sm">
          The editor couldn&apos;t finish this view. Try again, or return to the
          post list.
        </p>
        {error.digest ? (
          <p className="font-mono text-muted text-xs">Ref: {error.digest}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Button onPress={() => retry()}>Try again</Button>
        <Link
          href="/studio/posts"
          className={buttonVariants({ variant: "outline" })}
        >
          Back to posts
        </Link>
      </div>
    </div>
  );
}
