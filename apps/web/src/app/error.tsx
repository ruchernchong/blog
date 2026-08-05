"use client";

import { Button } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import Link from "next/link";
import { useEffect } from "react";
import { ERROR_IDS } from "@/constants/error-ids";
import { logError } from "@/lib/logger";

export default function RouteError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    logError(ERROR_IDS.ROUTE_SEGMENT_ERROR, error, {
      digest: error.digest,
    });
  }, [error]);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-8 px-4 py-12">
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="font-medium text-foreground text-xl tracking-tight">
          Something went wrong
        </p>
        <p className="max-w-md text-muted">
          This page hit a snag. You can try again, or head somewhere familiar
          while we sort it out.
        </p>
        {error.digest ? (
          <p className="font-mono text-muted text-xs">Ref: {error.digest}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Button
          onPress={() => retry()}
          style={{
            boxShadow: "0 8px 30px -10px oklch(0.60 0.18 25 / 0.4)",
          }}
        >
          Try again
        </Button>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Return home
        </Link>
      </div>

      <div className="h-px w-32 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
    </main>
  );
}
