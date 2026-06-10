"use client";

import { Card } from "@heroui/react";
import { ChartTooltip, LineChart } from "@heroui-pro/react";
import { APP_LOCALE, APP_TIME_ZONE } from "@/constants/date-time";
import type { Visit } from "@/lib/queries/posthog";

interface VisitsChartClientProps {
  data: Visit[];
}

type TooltipPayloadEntry = {
  color?: string;
  dataKey: unknown;
  stroke?: string;
  value: unknown;
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString(APP_LOCALE, {
    day: "numeric",
    month: "short",
    timeZone: APP_TIME_ZONE,
  });

export function VisitsChartClient({ data }: VisitsChartClientProps) {
  return (
    <Card>
      <Card.Header>
        <Card.Title>Recent Site Visits, 90 days</Card.Title>
      </Card.Header>
      <Card.Content>
        <LineChart data={data} height={300}>
          <LineChart.Grid vertical={false} />
          <LineChart.XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tickMargin={8}
          />
          <LineChart.YAxis width={30} />
          <LineChart.Line
            dataKey="visits"
            name="Visits"
            stroke="var(--chart-1)"
            strokeWidth={2}
            dot={false}
            type="monotone"
            activeDot={{ r: 6 }}
          />
          <LineChart.Tooltip
            // biome-ignore lint/suspicious/noExplicitAny: Recharts tooltip payload is loosely typed
            content={({ active, label, payload }: any) => {
              if (!active || !payload?.length) return null;

              return (
                <ChartTooltip>
                  <ChartTooltip.Header>
                    {formatDate(String(label))}
                  </ChartTooltip.Header>
                  {(payload as TooltipPayloadEntry[]).map((entry) => (
                    <ChartTooltip.Item key={String(entry.dataKey)}>
                      <ChartTooltip.Indicator
                        color={entry.color ?? entry.stroke}
                      />
                      <ChartTooltip.Label>Visits</ChartTooltip.Label>
                      <ChartTooltip.Value>
                        {Number(entry.value).toLocaleString()}
                      </ChartTooltip.Value>
                    </ChartTooltip.Item>
                  ))}
                </ChartTooltip>
              );
            }}
          />
        </LineChart>
      </Card.Content>
    </Card>
  );
}
