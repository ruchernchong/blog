import { Card, Skeleton } from "@heroui/react";
import { connection } from "next/server";
import { Suspense } from "react";
import { getPages } from "@/lib/queries/posthog";

const PAGE_VIEW_FALLBACKS = [
  "first-page",
  "second-page",
  "third-page",
  "fourth-page",
  "fifth-page",
] as const;

export function ViewsByPage() {
  return (
    <Suspense fallback={<ViewsByPageFallback />}>
      <ViewsByPageContent />
    </Suspense>
  );
}

export function ViewsByPageFallback() {
  return (
    <Card role="status" aria-label="Loading page view rankings">
      <div aria-hidden="true" className="flex flex-col gap-4">
        <Card.Header>
          <Skeleton className="h-6 w-36 rounded-lg" />
        </Card.Header>
        <Card.Content className="flex flex-col">
          {PAGE_VIEW_FALLBACKS.map((page) => (
            <div
              key={page}
              className="flex items-center justify-between gap-4 border-separator border-b py-3 last:border-b-0"
            >
              <Skeleton className="h-4 w-40 rounded-lg" />
              <Skeleton className="h-6 w-12 rounded-full" />
            </div>
          ))}
        </Card.Content>
      </div>
    </Card>
  );
}

async function ViewsByPageContent() {
  await connection();
  const data = await getPages();

  if (!data || data.length === 0) {
    return null;
  }

  const topPages = data.slice(0, 10);

  return (
    <Card>
      <Card.Header>
        <Card.Title>Views by page</Card.Title>
      </Card.Header>
      <Card.Content className="flex flex-col">
        {topPages.map((page) => (
          <div
            key={page.path}
            className="flex items-center justify-between gap-4 border-separator border-b py-3 last:border-b-0"
          >
            <span className="min-w-0 truncate font-mono text-sm">
              {page.path}
            </span>
            <span className="shrink-0 rounded-full bg-default px-2.5 py-1 font-medium text-xs tabular-nums">
              {page.count.toLocaleString("en-SG")}
            </span>
          </div>
        ))}
      </Card.Content>
    </Card>
  );
}
