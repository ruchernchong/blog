"use client";

import { useQueryState } from "nuqs";
import type { WeeklyShareRow } from "@/lib/usage/weekly-insights";
import { type UsageStackView, usageParsers } from "../searchParams";
import { StackShiftChartClient } from "./stack-shift-chart.client";
import type { SeriesMeta } from "./usage-series";
import { UsageToggle } from "./usage-toggle.client";

export interface StackShiftView {
  rows: WeeklyShareRow[];
  series: SeriesMeta[];
}

interface UsageStackShiftClientProps {
  views: Record<UsageStackView, StackShiftView>;
}

const sharePercent = new Intl.NumberFormat("en-SG", {
  maximumFractionDigits: 1,
  style: "percent",
});

/**
 * Model/agent switch plus a legend that doubles as the chart's labels: every
 * series is named with its all-time share, so identity never rests on colour.
 */
export function UsageStackShiftClient({
  views,
}: Readonly<UsageStackShiftClientProps>) {
  const [view, setView] = useQueryState(
    "stack",
    usageParsers.stack.withOptions({ history: "replace" }),
  );
  const active = views[view];

  return (
    <div className="flex flex-col gap-6">
      <UsageToggle<UsageStackView>
        label="Split by"
        onChange={setView}
        options={[
          { value: "model", label: "Models" },
          { value: "agent", label: "Agents" },
        ]}
        value={view}
      />
      <p className="sr-only">
        Weekly share chart. The legend below lists each series with its share of
        all tokens; per-model figures are in the Explorer table.
      </p>
      <StackShiftChartClient rows={active.rows} series={active.series} />
      <ul className="flex flex-wrap gap-4">
        {active.series.map((entry) => (
          <li className="flex items-center gap-2 text-sm" key={entry.key}>
            <span
              aria-hidden="true"
              className="size-3 shrink-0 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span>{entry.label}</span>
            <span className="text-muted tabular-nums">
              {sharePercent.format(entry.share)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
