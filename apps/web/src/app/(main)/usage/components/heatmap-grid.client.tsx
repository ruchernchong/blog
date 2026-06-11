"use client";

import { cn, Tooltip } from "@heroui/react";
import { INTENSITY_CLASSES } from "@workspace/usage";
import {
  formatCost,
  formatNumber,
  formatTokens,
} from "@workspace/usage/format";
import type {
  HeatmapCell,
  HeatmapLayout,
} from "@workspace/usage/heatmap-layout";
import { format, parseISO } from "date-fns";

interface HeatmapGridClientProps {
  layout: HeatmapLayout;
  today: string | null;
}

/**
 * Hand-rolled contribution grid: one CSS-grid column per week (Sun→Sat rows).
 * Only active days are wrapped in a HeroUI Tooltip, whose content renders lazily
 * on hover/focus, so the ~250-cell grid stays light.
 */
export function HeatmapGridClient({ layout, today }: HeatmapGridClientProps) {
  const { weeks, monthLabels } = layout;

  // One stretchable column per week so the grid fills its container's full
  // width; cells stay square via `aspect-square`.
  const columns = `repeat(${weeks.length}, minmax(0, 1fr))`;

  return (
    <div className="flex w-full flex-col gap-2">
      {/* Month labels: one slot per week column, label at its start column. */}
      <div
        className="grid gap-1 text-muted text-xs"
        style={{ gridTemplateColumns: columns }}
      >
        {weeks.map((_, weekIndex) => {
          const month = monthLabels.find((m) => m.weekIndex === weekIndex);
          return (
            <div
              className="h-4"
              // biome-ignore lint/suspicious/noArrayIndexKey: week columns are positional
              key={weekIndex}
            >
              {month?.label}
            </div>
          );
        })}
      </div>

      <div
        className="grid grid-flow-col grid-rows-7 gap-1"
        style={{ gridTemplateColumns: columns }}
      >
        {weeks.map((week, weekIndex) =>
          week.map((cell, dayIndex) => (
            <Cell
              cell={cell}
              today={today}
              // biome-ignore lint/suspicious/noArrayIndexKey: grid position is the identity
              key={`${weekIndex}-${dayIndex}`}
            />
          )),
        )}
      </div>
    </div>
  );
}

function Cell({ cell, today }: { cell: HeatmapCell; today: string | null }) {
  const day = cell.contribution;

  // Padding slot outside the calendar year: render a plain square so only real
  // days expose activity stats on hover/focus.
  if (!day) {
    return <div className="aspect-square w-full rounded-sm bg-transparent" />;
  }

  // Future days carry no data yet; keep the base swatch so the year grid stays
  // visually complete, but skip the tooltip and hover affordances.
  if (today && day.date > today) {
    return (
      <div
        className={cn("aspect-square w-full rounded-sm", INTENSITY_CLASSES[0])}
      />
    );
  }

  const label = format(parseISO(day.date), "d MMM yyyy");
  const isToday = day.date === today;

  return (
    <Tooltip delay={0}>
      <Tooltip.Trigger
        aria-label={`${isToday ? "Today, " : ""}${label}: ${formatTokens(day.totals.tokens)} tokens, ${formatCost(day.totals.cost)}, ${formatNumber(day.totals.messages)} messages`}
        className={cn(
          "aspect-square w-full rounded-sm transition duration-150 ease-out hover:scale-125 hover:ring-2 hover:ring-accent/60 hover:ring-offset-1 hover:ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          INTENSITY_CLASSES[day.intensity],
          isToday &&
            "ring-2 ring-primary/70 ring-offset-1 ring-offset-background",
        )}
      />
      <Tooltip.Content offset={8} showArrow>
        <Tooltip.Arrow />
        <div className="flex flex-col gap-1">
          <p className="font-semibold">{isToday ? `Today, ${label}` : label}</p>
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
