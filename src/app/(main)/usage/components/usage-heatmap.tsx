import { Card } from "@heroui/react";
import { eachDayOfInterval, format } from "date-fns";
import { buildHeatmapLayout } from "@/lib/usage/heatmap-layout";
import type { DayContribution } from "@/lib/usage/types";
import { type HeatmapYear, UsageHeatmapClient } from "./usage-heatmap.client";

interface UsageHeatmapProps {
  contributions: DayContribution[];
}

function emptyDay(date: string): DayContribution {
  return {
    date,
    totals: { tokens: 0, cost: 0, messages: 0 },
    intensity: 0,
    tokenBreakdown: {
      input: 0,
      output: 0,
      cacheRead: 0,
      cacheWrite: 0,
      reasoning: 0,
    },
    agents: [],
  };
}

/**
 * Expand a year's sparse days into every calendar day from 1 Jan to 31 Dec,
 * filling the gaps (before the data starts, and after the latest day) with
 * zero-activity cells. This keeps every year a full 52–53 week grid so it spans
 * the card's full width regardless of how much of the year is covered.
 */
function fullYear(year: string, days: DayContribution[]): DayContribution[] {
  const byDate = new Map(days.map((day) => [day.date, day]));
  const yearNumber = Number(year);
  return eachDayOfInterval({
    start: new Date(yearNumber, 0, 1),
    end: new Date(yearNumber, 11, 31),
  }).map((date) => {
    const key = format(date, "yyyy-MM-dd");
    return byDate.get(key) ?? emptyDay(key);
  });
}

/**
 * Server component: the card shell plus the per-year layout for the contribution
 * heatmap. Contributions are bucketed by calendar year, padded to the full year,
 * and each year gets its own pure, serializable `buildHeatmapLayout` result, so
 * the client only switches between ready-made grids. Years are newest-first.
 */
export function UsageHeatmap({ contributions }: UsageHeatmapProps) {
  const byYear = new Map<string, DayContribution[]>();
  for (const day of contributions) {
    const year = day.date.slice(0, 4);
    const bucket = byYear.get(year);
    if (bucket) {
      bucket.push(day);
    } else {
      byYear.set(year, [day]);
    }
  }

  const years: HeatmapYear[] = [...byYear.entries()]
    .map(([year, days]) => ({
      year,
      layout: buildHeatmapLayout(fullYear(year, days)),
    }))
    .sort((a, b) => b.year.localeCompare(a.year));

  return (
    <Card>
      <Card.Header>
        <Card.Title>Activity</Card.Title>
        <Card.Description>Daily token usage across all agents</Card.Description>
      </Card.Header>
      <Card.Content>
        {years.length === 0 ? (
          <p className="text-muted text-sm">No activity yet.</p>
        ) : (
          <UsageHeatmapClient years={years} />
        )}
      </Card.Content>
    </Card>
  );
}
