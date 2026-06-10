"use client";

import { Button, cn } from "@heroui/react";
import { INTENSITY_CLASSES } from "@workspace/usage";
import type { HeatmapLayout } from "@workspace/usage/heatmap-layout";
import { useEffect, useState } from "react";
import { APP_LOCALE, APP_TIME_ZONE } from "@/constants/date-time";
import { HeatmapGridClient } from "./heatmap-grid.client";

export interface HeatmapYear {
  /** Calendar year, e.g. "2026". */
  year: string;
  layout: HeatmapLayout;
}

interface UsageHeatmapClientProps {
  /** Newest year first; each layout is precomputed server-side. */
  years: HeatmapYear[];
}

const dateKeyFormatter = new Intl.DateTimeFormat(APP_LOCALE, {
  day: "2-digit",
  month: "2-digit",
  timeZone: APP_TIME_ZONE,
  year: "numeric",
});

function getTodayDateKey(date: Date) {
  const parts = dateKeyFormatter.formatToParts(date);
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

/**
 * Filters the contribution heatmap to a single calendar year. Layouts arrive
 * ready-built and serializable, so switching years is a cheap re-render of an
 * already-computed grid. The year switcher only appears when there is more than
 * one year of data.
 */
export function UsageHeatmapClient({ years }: UsageHeatmapClientProps) {
  const [selectedYear, setSelectedYear] = useState(years[0].year);
  const [today, setToday] = useState<string | null>(null);
  const active = years.find((y) => y.year === selectedYear) ?? years[0];

  useEffect(() => {
    setToday(getTodayDateKey(new Date()));
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {years.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {years.map((y) => (
            <Button
              key={y.year}
              onPress={() => setSelectedYear(y.year)}
              size="sm"
              variant={y.year === active.year ? "primary" : "ghost"}
            >
              {y.year}
            </Button>
          ))}
        </div>
      )}

      <HeatmapGridClient layout={active.layout} today={today} />

      <div className="flex items-center gap-2 text-muted text-xs">
        <span>Less</span>
        {INTENSITY_CLASSES.map((className, intensity) => (
          <span
            className={cn("size-3 rounded-sm", className)}
            // biome-ignore lint/suspicious/noArrayIndexKey: legend swatches are positional
            key={intensity}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
