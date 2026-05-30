import { Card } from "@heroui/react";
import type { UsageBreakdownRow } from "@/lib/usage/types";
import { BreakdownChartClient } from "./breakdown-chart.client";

interface UsageBreakdownProps {
  title: string;
  description: string;
  rows: UsageBreakdownRow[];
}

/**
 * Server component: the card shell for a breakdown. Only the interactive chart
 * is a client leaf — the structure stays on the server.
 */
export function UsageBreakdown({
  title,
  description,
  rows,
}: UsageBreakdownProps) {
  return (
    <Card>
      <Card.Header>
        <Card.Title>{title}</Card.Title>
        <Card.Description>{description}</Card.Description>
      </Card.Header>
      <Card.Content>
        <BreakdownChartClient rows={rows} />
      </Card.Content>
    </Card>
  );
}
