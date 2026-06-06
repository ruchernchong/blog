import type { DayContribution } from "@workspace/usage/types";
import { TrendChartClient } from "./trend-chart.client";

interface UsageTrendProps {
  contributions: DayContribution[];
}

export function UsageTrend({ contributions }: UsageTrendProps) {
  const data = contributions.map((day) => ({
    date: day.date,
    tokens: day.totals.tokens,
  }));

  return <TrendChartClient data={data} />;
}
