"use client";

import { cn, Tooltip } from "@heroui/react";
import { format, parseISO } from "date-fns";
import { formatCost, formatNumber, formatTokens } from "@/lib/usage/format";
import { INTENSITY_CLASSES } from "@/lib/usage/heatmap-intensity";
import type { HeatmapCell, HeatmapLayout } from "@/lib/usage/heatmap-layout";

interface HeatmapGridClientProps {
  layout: HeatmapLayout;
}

/**
 * Hand-rolled contribution grid: one CSS-grid column per week (Sun→Sat rows).
 * Only active days are wrapped in a HeroUI Tooltip, whose content renders lazily
 * on hover/focus, so the ~250-cell grid stays light.
 */
export function HeatmapGridClient({ layout }: HeatmapGridClientProps) {
  const { weeks, monthLabels } = layout;

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex flex-col gap-2">
        {/* Month labels: one slot per week column, label at its start column. */}
        <div className="grid grid-flow-col grid-rows-1 gap-1 text-muted text-xs">
          {weeks.map((_, weekIndex) => {
            const month = monthLabels.find((m) => m.weekIndex === weekIndex);
            return (
              <div
                className="h-4 w-3"
                // biome-ignore lint/suspicious/noArrayIndexKey: week columns are positional
                key={weekIndex}
              >
                {month?.label}
              </div>
            );
          })}
        </div>

        <div className="grid grid-flow-col grid-rows-7 gap-1">
          {weeks.map((week, weekIndex) =>
            week.map((cell, dayIndex) => (
              <Cell
                cell={cell}
                // biome-ignore lint/suspicious/noArrayIndexKey: grid position is the identity
                key={`${weekIndex}-${dayIndex}`}
              />
            )),
          )}
        </div>
      </div>
    </div>
  );
}

function Cell({ cell }: { cell: HeatmapCell }) {
  const day = cell.contribution;

  // Padding slot (outside the data range) or zero-activity day: render a plain
  // square with no tooltip to keep the mounted Tooltip count low.
  if (!day || day.intensity === 0) {
    return (
      <div
        className={cn(
          "size-3 rounded-sm",
          day ? INTENSITY_CLASSES[0] : "bg-transparent",
        )}
      />
    );
  }

  const label = format(parseISO(day.date), "d MMM yyyy");

  return (
    <Tooltip delay={0}>
      <button
        aria-label={`${label}: ${formatTokens(day.totals.tokens)} tokens, ${formatCost(day.totals.cost)}, ${formatNumber(day.totals.messages)} messages`}
        className={cn(
          "size-3 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          INTENSITY_CLASSES[day.intensity],
        )}
        type="button"
      />
      <Tooltip.Content>
        <div className="flex flex-col gap-1">
          <p className="font-semibold">{label}</p>
          <p className="text-muted text-xs">
            {formatTokens(day.totals.tokens)} tokens ·{" "}
            {formatCost(day.totals.cost)} · {formatNumber(day.totals.messages)}{" "}
            messages
          </p>
          {day.agents.length > 0 && (
            <ul className="flex flex-col gap-0.5 text-xs">
              {day.agents.map((agent) => (
                <li className="flex justify-between gap-4" key={agent.agent}>
                  <span>{agent.agent}</span>
                  <span className="text-muted">
                    {formatTokens(agent.tokens)} · {formatCost(agent.cost)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Tooltip.Content>
    </Tooltip>
  );
}
