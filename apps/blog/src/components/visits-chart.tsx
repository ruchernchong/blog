"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { trpc } from "@/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";
import React from "react";
import { Loader } from "@/components/loader";

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
  });

const VisitsChart = () => {
  const { data, isLoading } = trpc.analytics.getVisits.useQuery();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Site Visits</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Loader />
        ) : (
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
                  style={{ stroke: `oklch(0.592 0.249 0.584)` }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VisitsChart;
