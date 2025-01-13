"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AnalyticsData {
  id: string;
  createdAt: string;
}

interface ChartData {
  timestamp: string;
  views: number;
}

const LineChartComponent = ({ data }: { data: AnalyticsData[] }) => {
  // Process data to group by 5-minute intervals
  const processData = (rawData: AnalyticsData[]): ChartData[] => {
    const groupedData = rawData.reduce(
      (acc: { [key: string]: number }, item) => {
        // Create 5-minute interval timestamp
        const date = new Date(item.createdAt);
        date.setMinutes(Math.floor(date.getMinutes() / 5) * 5);
        date.setSeconds(0);
        date.setMilliseconds(0);

        const timeKey = date.toISOString();

        acc[timeKey] = (acc[timeKey] || 0) + 1;
        return acc;
      },
      {},
    );

    // Convert to array format for the chart
    return Object.entries(groupedData)
      .map(([timestamp, views]) => ({
        timestamp: new Date(timestamp).toLocaleTimeString(),
        views,
      }))
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );
  };

  const chartData = processData(data);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Views per 5 Minutes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis
                dataKey="timestamp"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="views"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ fill: "#2563eb" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default LineChartComponent;
