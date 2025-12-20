"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Visit } from "@/app/(blog)/analytics/_actions/visits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface VisitsChartProps {
  data: Visit[];
}

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
  });

export function VisitsChart({ data }: VisitsChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Site Visits</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-75 w-full">
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={formatDate} />
              <YAxis />
              <Tooltip
                labelFormatter={formatDate}
                formatter={(value) => [value, "Visits"]}
              />
              <Line
                type="monotone"
                dataKey="visits"
                strokeWidth={2}
                activeDot={{
                  r: 6,
                }}
                stroke="var(--chart-1)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
