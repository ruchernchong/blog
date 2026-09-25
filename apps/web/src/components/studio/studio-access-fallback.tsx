import { Skeleton } from "@heroui/react";

const STUDIO_NAVIGATION_ITEMS = [
  "posts",
  "series",
  "media",
  "analytics",
  "oauth-clients",
] as const;

export function StudioAccessFallback() {
  return (
    <div
      role="status"
      aria-label="Loading Content Studio"
      className="flex min-h-svh bg-background"
    >
      <aside
        aria-hidden="true"
        className="hidden w-64 shrink-0 flex-col gap-6 border-border border-r p-6 md:flex"
      >
        <Skeleton className="h-8 w-32 rounded-lg" />
        <div className="flex flex-col gap-4">
          {STUDIO_NAVIGATION_ITEMS.map((item) => (
            <Skeleton key={item} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      </aside>
      <main
        aria-hidden="true"
        className="flex flex-1 flex-col gap-6 p-6 md:p-8"
      >
        <Skeleton className="h-9 w-48 rounded-lg" />
        <Skeleton className="h-5 w-80 max-w-full rounded-lg" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </main>
    </div>
  );
}
