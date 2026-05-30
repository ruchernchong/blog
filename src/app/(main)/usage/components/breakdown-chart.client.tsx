"use client";

import { BarChart, ChartTooltip } from "@heroui-pro/react";
import { formatCost, formatTokens } from "@/lib/usage/format";
import type { UsageBreakdownRow } from "@/lib/usage/types";

interface BreakdownChartClientProps {
  rows: UsageBreakdownRow[];
}

/**
 * Object-literal `type` (not `interface`) so it carries an implicit index
 * signature and stays assignable to the chart's `Record<string, string|number>`
 * data prop. `cost` is pre-formatted (cost may be "N.A.").
 */
type ChartPoint = {
  key: string;
  tokens: number;
  cost: string;
};

/**
 * Interactive client leaf: a horizontal bar chart of tokens per row, with a
 * custom tooltip showing both tokens and cost (cost may be "N.A.").
 */
export function BreakdownChartClient({ rows }: BreakdownChartClientProps) {
  const data: ChartPoint[] = rows.map((row) => ({
    key: row.key,
    tokens: row.tokens,
    cost: formatCost(row.cost),
  }));

  return (
    <BarChart
      data={data}
      height={Math.max(160, data.length * 40)}
      layout="vertical"
    >
      <BarChart.XAxis tickFormatter={formatTokens} type="number" />
      <BarChart.YAxis
        dataKey="key"
        tickMargin={4}
        type="category"
        width={140}
      />
      <BarChart.Bar
        dataKey="tokens"
        fill="var(--color-accent)"
        name="Tokens"
        radius={[0, 8, 8, 0]}
      />
      <BarChart.Tooltip
        content={({ active, payload }) => {
          if (!active || !payload?.length) return null;
          const point = payload[0]?.payload as ChartPoint | undefined;
          if (!point) return null;
          return (
            <ChartTooltip>
              <ChartTooltip.Header>{point.key}</ChartTooltip.Header>
              <ChartTooltip.Item>
                <ChartTooltip.Indicator color="var(--color-accent)" />
                <ChartTooltip.Label>Tokens</ChartTooltip.Label>
                <ChartTooltip.Value>
                  {formatTokens(point.tokens)}
                </ChartTooltip.Value>
              </ChartTooltip.Item>
              <ChartTooltip.Item>
                <ChartTooltip.Label>Cost</ChartTooltip.Label>
                <ChartTooltip.Value>{point.cost}</ChartTooltip.Value>
              </ChartTooltip.Item>
            </ChartTooltip>
          );
        }}
      />
    </BarChart>
  );
}
