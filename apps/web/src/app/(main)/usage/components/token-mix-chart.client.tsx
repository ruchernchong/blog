"use client";

import { BarChart, ChartTooltip } from "@heroui-pro/react";
import { formatTokens } from "@workspace/usage/format";
import type { TooltipContentProps } from "recharts";

/** One category slice of the token mix, pre-computed and coloured by the shell. */
export interface MixSegment {
  key: string;
  label: string;
  value: number;
  pct: number;
  color: string;
}

interface TokenMixChartClientProps {
  segments: MixSegment[];
  total: number;
}

/** A single chart row holding every category as its own numeric key. */
type ChartRow = Record<string, string | number>;

type TokenMixTooltipProps = Partial<TooltipContentProps<number, string>> & {
  total: number;
};

/** Recharts injects `active` and `payload` when cloning the tooltip content. */
function TokenMixTooltip({ active, payload, total }: TokenMixTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <ChartTooltip>
      {payload.map((entry) => {
        const value = Number(entry.value);
        const pct = total > 0 ? Math.round((value / total) * 100) : 0;
        return (
          <ChartTooltip.Item key={String(entry.dataKey)}>
            <ChartTooltip.Indicator color={String(entry.color ?? entry.fill)} />
            <ChartTooltip.Label>{entry.name}</ChartTooltip.Label>
            <ChartTooltip.Value>
              {formatTokens(value)} ({pct}%)
            </ChartTooltip.Value>
          </ChartTooltip.Item>
        );
      })}
    </ChartTooltip>
  );
}

/** Rounds the outer ends of the stack: first segment left, last segment right. */
function segmentRadius(
  index: number,
  lastIndex: number,
): [number, number, number, number] | undefined {
  if (index === 0) return [8, 0, 0, 8];
  if (index === lastIndex) return [0, 8, 8, 0];
  return undefined;
}

/**
 * Interactive client leaf: a single horizontal stacked bar of the all-time
 * token mix. Segments arrive pre-sorted (largest first) so the rounded ends
 * land on the first and last bars.
 */
export function TokenMixChartClient({
  segments,
  total,
}: TokenMixChartClientProps) {
  const row: ChartRow = { label: "Tokens" };
  for (const segment of segments) row[segment.key] = segment.value;
  const data: ChartRow[] = [row];
  const lastIndex = segments.length - 1;

  return (
    <BarChart
      data={data}
      height={56}
      layout="vertical"
      margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
    >
      <BarChart.XAxis domain={[0, total]} hide type="number" />
      <BarChart.YAxis dataKey="label" hide type="category" />
      {segments.map((segment, index) => (
        <BarChart.Bar
          barSize={32}
          dataKey={segment.key}
          fill={segment.color}
          key={segment.key}
          name={segment.label}
          radius={segmentRadius(index, lastIndex)}
          stackId="mix"
        />
      ))}
      <BarChart.Tooltip content={<TokenMixTooltip total={total} />} />
    </BarChart>
  );
}
