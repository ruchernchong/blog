"use client";

import { AreaChart, ChartTooltip } from "@heroui-pro/react";
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

// A used-but-tiny share would round to "0%", which reads as unused.
const formatShare = (share: number) =>
  share < 0.005 ? "<1%" : sharePercent.format(share);

const formatTick = (week: string) => format(parseISO(week), "MMM yy");

/**
 * Interactive client leaf: 100% stacked area of weekly token share. Rows are
 * already shares (0–1), so the stack tops out at 100% without relying on a
 * stack offset. Idle weeks have no series keys, leaving a gap. A 2px
 * background stroke separates adjacent fills.
 */
export function StackShiftChartClient({
  rows,
  series,
}: StackShiftChartClientProps) {
  const colorByKey = new Map(series.map((entry) => [entry.key, entry.color]));
  // One tick per month (its first week), so a month label never repeats.
  const monthTicks = rows
    .map((row) => row.week)
    .filter(
      (week, index, weeks) =>
        index === 0 || week.slice(0, 7) !== weeks[index - 1].slice(0, 7),
    );

  return (
    <AreaChart data={rows} height={320}>
      <AreaChart.Grid vertical={false} />
      <AreaChart.XAxis
        dataKey="week"
        minTickGap={48}
        tickFormatter={formatTick}
        tickMargin={8}
        ticks={monthTicks}
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
        content={({ active, label, payload }) => {
          if (!active || !payload?.length) return null;
          // Only series used that week, largest share first; the stable sort
          // keeps legend order on ties.
          const entries = payload
            .filter((entry) => Number(entry.value) > 0)
            .sort((a, b) => Number(b.value) - Number(a.value));

          // The auto TooltipContent colours indicators from `stroke`, which
          // here is the background separator, so colour them by series
          // instead.
          return (
            <ChartTooltip>
              <ChartTooltip.Header>
                Week of {format(parseISO(String(label)), "d MMM yyyy")}
              </ChartTooltip.Header>
              {entries.length === 0 ? (
                <ChartTooltip.Item>
                  <ChartTooltip.Label>No activity</ChartTooltip.Label>
                </ChartTooltip.Item>
              ) : null}
              {entries.map((entry) => (
                <ChartTooltip.Item key={String(entry.dataKey)}>
                  <ChartTooltip.Indicator
                    color={colorByKey.get(String(entry.dataKey))}
                  />
                  <ChartTooltip.Label>{entry.name}</ChartTooltip.Label>
                  <ChartTooltip.Value>
                    {formatShare(Number(entry.value))}
                  </ChartTooltip.Value>
                </ChartTooltip.Item>
              ))}
            </ChartTooltip>
          );
        }}
      />
    </AreaChart>
  );
}
