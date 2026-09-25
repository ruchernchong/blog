import { Card, Skeleton } from "@heroui/react";

const STUDIO_FORM_FIELDS = [
  "title",
  "slug",
  "summary",
  "content",
  "status",
] as const;

interface StudioFormFallbackProps {
  label: string;
}

export function StudioFormFallback({ label }: StudioFormFallbackProps) {
  return (
    <div role="status" aria-label={label} className="flex flex-col gap-6">
      <div aria-hidden="true" className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-9 w-56 rounded-lg" />
          <Skeleton className="h-5 w-80 max-w-full rounded-lg" />
        </div>
        <Card>
          <Card.Content className="flex flex-col gap-6">
            {STUDIO_FORM_FIELDS.map((field) => (
              <div key={field} className="flex flex-col gap-2">
                <Skeleton className="h-4 w-24 rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
