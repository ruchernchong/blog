"use client";

import { Button, cn } from "@heroui/react";
import { INTENSITY_CLASSES } from "@workspace/usage";
import type { HeatmapLayout } from "@workspace/usage/heatmap-layout";
import { useState } from "react";
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

/**
 * Filters the contribution heatmap to a single calendar year. Layouts arrive
 * ready-built and serializable, so switching years is a cheap re-render of an
 * already-computed grid. The year switcher only appears when there is more than
 * one year of data.
 */
export function UsageHeatmapClient({ years }: UsageHeatmapClientProps) {
  const [selectedYear, setSelectedYear] = useState(years[0].year);
  const active = years.find((y) => y.year === selectedYear) ?? years[0];

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

      <HeatmapGridClient layout={active.layout} />

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
