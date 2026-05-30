"use client";

import { AreaChart } from "@heroui-pro/react";
import { format, parseISO } from "date-fns";
import { formatTokens } from "@/lib/usage/format";

interface TrendChartClientProps {
  data: { date: string; tokens: number }[];
}

const formatTick = (date: string) => format(parseISO(date), "MMM");

/** Interactive client leaf: the daily-tokens area chart. */
export function TrendChartClient({ data }: TrendChartClientProps) {
  return (
    <AreaChart data={data} height={240}>
      <AreaChart.Grid vertical={false} />
      <AreaChart.XAxis
        dataKey="date"
        minTickGap={40}
        tickFormatter={formatTick}
        tickMargin={8}
      />
      <AreaChart.YAxis tickFormatter={formatTokens} width={48} />
      <AreaChart.Area
        dataKey="tokens"
        dot={false}
        fill="var(--color-primary)"
        fillOpacity={0.15}
        name="Tokens"
        stroke="var(--color-primary)"
        strokeWidth={2}
        type="monotone"
      />
      <AreaChart.Tooltip
        content={
          <AreaChart.TooltipContent
            labelFormatter={(label) =>
              format(parseISO(String(label)), "d MMM yyyy")
            }
            valueFormatter={(value) => formatTokens(Number(value))}
          />
        }
      />
    </AreaChart>
  );
}
