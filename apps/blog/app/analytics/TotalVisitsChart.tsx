"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import React, { useState } from "react";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Visit } from "../actions/analytics/visits";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [timeRange, setTimeRange] = useState("30d");

  const filteredData = data.filter((item) => {
    const date = new Date(item.date);
    const referenceDate = new Date("2025-01-01");

    let daysToSubtract = 30;
    if (timeRange === "90d") {
      daysToSubtract = 90;
    } else if (timeRange === "7d") {
      daysToSubtract = 7;
    }

    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);
    return date >= startDate;
  });

  return (
    <Card>
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 md:flex-row">
        <div className="grid flex-1 gap-1 text-center md:text-left">
          <CardTitle>Total Visits</CardTitle>
          <CardDescription></CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="w-[160px] rounded-lg md:ml-auto"
            aria-label="Select a value"
          >
            <SelectValue placeholder="Last 30 days" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="7d" className="rounded-lg">
              Last 7 days
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              Last 30 days
            </SelectItem>
            <SelectItem value="90d" className="rounded-lg">
              Last 3 months
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="p-2">
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <LineChart accessibilityLayer data={filteredData}>
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
