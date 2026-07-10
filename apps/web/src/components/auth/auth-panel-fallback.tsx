import { Card, Skeleton } from "@heroui/react";

interface AuthPanelFallbackProps {
  label: string;
}

export function AuthPanelFallback({ label }: AuthPanelFallbackProps) {
  return (
    <Card role="status" aria-label={label}>
      <div aria-hidden="true" className="flex flex-col gap-6">
        <Card.Header className="items-center text-center">
          <Skeleton className="h-6 w-36 rounded-lg" />
          <Skeleton className="h-4 w-56 rounded-lg" />
        </Card.Header>
        <Card.Content className="flex flex-col gap-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </Card.Content>
      </div>
    </Card>
  );
}
