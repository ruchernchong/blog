import { Card } from "@heroui/react";
import type { DayContribution } from "@workspace/usage/types";
import { TrendChartClient } from "./trend-chart.client";

interface UsageTrendProps {
  contributions: DayContribution[];
}

/**
 * Server component: the card shell + data shaping for the trend. Only the chart
 * itself is a client leaf.
 */
export function UsageTrend({ contributions }: UsageTrendProps) {
  const data = contributions.map((day) => ({
    date: day.date,
    tokens: day.totals.tokens,
  }));

  return (
    <Card>
      <Card.Header>
        <Card.Title>Tokens per day</Card.Title>
        <Card.Description>Daily token usage across all agents</Card.Description>
      </Card.Header>
      <Card.Content>
        <TrendChartClient data={data} />
      </Card.Content>
    </Card>
  );
}
