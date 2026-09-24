"use client";

import { AreaChart } from "@heroui-pro/react";
import type { WeeklyShareRow } from "@workspace/usage/weekly-insights";
import { format, parseISO } from "date-fns";
import type { SeriesMeta } from "./usage-series";

interface StackShiftChartClientProps {
  rows: WeeklyShareRow[];
  series: SeriesMeta[];
}

const sharePercent = new Intl.NumberFormat("en-SG", {
  maximumFractionDigits: 0,
  style: "percent",
});

const formatTick = (week: string) => format(parseISO(week), "MMM yy");

/**
 * Interactive client leaf: 100% stacked area of weekly token share. Rows are
 * already shares (0–1), so the stack tops out at 100% without relying on a
 * stack offset. A 2px background stroke separates adjacent fills.
 */
export function StackShiftChartClient({
  rows,
  series,
}: StackShiftChartClientProps) {
  return (
    <AreaChart data={rows} height={320}>
      <AreaChart.Grid vertical={false} />
      <AreaChart.XAxis
        dataKey="week"
        minTickGap={48}
        tickFormatter={formatTick}
        tickMargin={8}
      />
      <AreaChart.YAxis
        domain={[0, 1]}
        tickFormatter={(value: number) => sharePercent.format(value)}
        width={48}
      />
      {series.map((entry) => (
        <AreaChart.Area
          dataKey={entry.key}
          dot={false}
          fill={entry.color}
          fillOpacity={0.9}
          isAnimationActive={false}
          key={entry.key}
          name={entry.label}
          stackId="share"
          stroke="var(--background)"
          strokeWidth={2}
          type="monotone"
        />
      ))}
      <AreaChart.Tooltip
        content={
          <AreaChart.TooltipContent
            labelFormatter={(label) =>
              `Week of ${format(parseISO(String(label)), "d MMM yyyy")}`
            }
            valueFormatter={(value) => sharePercent.format(Number(value))}
          />
        }
      />
    </AreaChart>
  );
}
