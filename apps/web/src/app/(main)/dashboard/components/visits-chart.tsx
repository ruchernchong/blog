import { Card, Skeleton } from "@heroui/react";
import { connection } from "next/server";
import { Suspense } from "react";
import { getVisits } from "@/lib/queries/posthog";
import { VisitsChartClient } from "./visits-chart.client";

export function VisitsChart() {
  return (
    <Suspense fallback={<VisitsChartFallback />}>
      <VisitsChartContent />
    </Suspense>
  );
}

export function VisitsChartFallback() {
  return (
    <Card role="status" aria-label="Loading recent site visits">
      <div aria-hidden="true" className="flex flex-col gap-4">
        <Card.Header>
          <Skeleton className="h-6 w-56 rounded-lg" />
        </Card.Header>
        <Card.Content>
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </Card.Content>
      </div>
    </Card>
  );
}

async function VisitsChartContent() {
  await connection();
  const visits = await getVisits();
  return <VisitsChartClient data={visits} />;
}
