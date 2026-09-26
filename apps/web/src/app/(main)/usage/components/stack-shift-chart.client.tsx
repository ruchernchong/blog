"use client";

import { AreaChart, ChartTooltip } from "@heroui-pro/react";
import { format, parseISO } from "date-fns";
import { Fragment } from "react";
import type { TooltipContentProps } from "recharts";
import {
  memberShareKey,
  type WeeklyShareRow,
} from "@/lib/usage/weekly-insights";
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

type StackShiftTooltipProps = Partial<TooltipContentProps<number, string>> & {
  seriesByKey: Map<string, SeriesMeta>;
};

/** Members that week, largest first; none when the series is just itself. */
function usedMembers(entry: SeriesMeta, row: WeeklyShareRow) {
  const { key, members } = entry;
  if (members.length === 1 && members[0].key === key) return [];
  return members
    .map((member) => ({
      ...member,
      share: Number(row[memberShareKey(key, member.key)] ?? 0),
    }))
    .filter((member) => member.share > 0)
    .sort((a, b) => b.share - a.share);
}

/**
 * Only series used that week, largest share first; the stable sort keeps
 * legend order on ties. Each family lists its models used that week beneath
 * it, so versions within a band stay distinguishable. The auto TooltipContent colours indicators from
 * `stroke`, which here is the background separator, so colour them by series
 * instead. Recharts injects `active`, `label` and `payload` when cloning.
 */
function StackShiftTooltip({
  active,
  label,
  payload,
  seriesByKey,
}: StackShiftTooltipProps) {
  if (!active) return null;
  const entries = (payload ?? [])
    .filter((entry) => Number(entry.value) > 0)
    .sort((a, b) => Number(b.value) - Number(a.value));

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
      {entries.map((entry) => {
        const meta = seriesByKey.get(String(entry.dataKey));
        const members =
          meta && entry.payload ? usedMembers(meta, entry.payload) : [];
        return (
          <Fragment key={String(entry.dataKey)}>
            <ChartTooltip.Item>
              <ChartTooltip.Indicator color={meta?.color} />
              <ChartTooltip.Label>{entry.name}</ChartTooltip.Label>
              <ChartTooltip.Value>
                {formatShare(Number(entry.value))}
              </ChartTooltip.Value>
            </ChartTooltip.Item>
            {members.map((member) => (
              <ChartTooltip.Item className="pl-5" key={member.key}>
                <ChartTooltip.Label className="text-muted">
                  {member.label}
                </ChartTooltip.Label>
                <ChartTooltip.Value className="text-muted">
                  {formatShare(member.share)}
                </ChartTooltip.Value>
              </ChartTooltip.Item>
            ))}
          </Fragment>
        );
      })}
    </ChartTooltip>
  );
}

/**
 * Interactive client leaf: 100% stacked area of weekly token share. Rows are
 * already shares (0–1), so the stack tops out at 100% without relying on a
 * stack offset. Idle weeks have no series keys, leaving a gap. A 2px
 * background stroke separates adjacent fills.
 */
export function StackShiftChartClient({
  rows,
  series,
}: Readonly<StackShiftChartClientProps>) {
  const seriesByKey = new Map(series.map((entry) => [entry.key, entry]));
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
      {/* Keep idle weeks' empty entries so Recharts still shows the tooltip
          (it hides on an empty payload); StackShiftTooltip drops them. */}
      <AreaChart.Tooltip
        content={<StackShiftTooltip seriesByKey={seriesByKey} />}
        filterNull={false}
      />
    </AreaChart>
  );
}
