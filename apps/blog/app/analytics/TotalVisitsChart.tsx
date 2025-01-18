"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import React from "react";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Visit } from "../actions/analytics/visits";

interface Props {
  data: Visit[];
}

const chartConfig = {
  visits: {
    label: "Visits",
  },
} satisfies ChartConfig;

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const TotalVisitsChart = ({ data }: Props) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Total Visits</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <LineChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={formatDate}
            />
            <YAxis />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent labelFormatter={formatDate} />}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Line
              dataKey="visits"
              type="natural"
              strokeWidth={2}
              stroke="hsl(var(--primary))"
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default TotalVisitsChart;
