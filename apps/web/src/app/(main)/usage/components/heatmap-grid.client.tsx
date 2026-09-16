"use client";

import { cn, Label, Meter, Popover } from "@heroui/react";
import {
  BubbleChatIcon,
  DatabaseIcon,
  DollarCircleIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { HugeiconsIcon } from "@hugeicons/react";
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
import type {
  DayContribution,
  ModelDayBreakdown,
} from "@workspace/usage/types";
import { format, parseISO } from "date-fns";
import { useEffect, useMemo, useRef, useState } from "react";

interface HeatmapGridClientProps {
  layout: HeatmapLayout;
  /** Registry slug → display name, for the per-day model rows. */
  modelDisplayNames: Record<string, string>;
  today: string | null;
}

/**
 * Hand-rolled contribution grid: one CSS-grid column per week (Sun→Sat rows).
 * Only active days are pressable: each opens a HeroUI Popover with the day's
 * totals as icon-led figures and the models that ran. The content renders
 * lazily on open, so the ~250-cell grid stays light.
 *
 * A caption under the grid tracks the hovered/focused day and spells out the
 * press affordance — a heatmap otherwise reads as decoration, and the popover
 * is the only way to reach a day's breakdown.
 *
 * The grid keeps its cell size and scrolls horizontally when the container is
 * too narrow for a full year, rather than shrinking cells to fit. A press
 * target is the whole point here, so width is the thing that gives.
 */
export function HeatmapGridClient({
  layout,
  modelDisplayNames,
  today,
}: HeatmapGridClientProps) {
  const { weeks, monthLabels } = layout;
  const [preview, setPreview] = useState<DayContribution | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // The day worth opening on: today while viewing the year that contains it,
  // otherwise the last day of that year. Deriving it as a plain date also gives
  // the effect below a dependency that changes on a year switch.
  const anchorDate = useMemo(() => {
    const dates = weeks.flatMap((week) =>
      week.map((cell) => cell.date).filter((date) => date !== null),
    );
    return today && dates.includes(today) ? today : (dates.at(-1) ?? null);
  }, [weeks, today]);

  // When the year does not fit, opening on January is the least useful view: in
  // August that is eight months of empty cells. Assigning scrollLeft keeps this
  // inside the scroller, where `scrollIntoView` would drag the whole page down
  // to the heatmap on load.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !anchorDate) {
      return;
    }

    const furthest = scroller.scrollWidth - scroller.clientWidth;
    if (furthest <= 0) {
      return;
    }

    const anchor = scroller.querySelector(`[data-date="${anchorDate}"]`);
    if (!anchor) {
      scroller.scrollLeft = furthest;
      return;
    }

    // Right-align the anchor, so the run-up to it is what fills the view.
    const cell = anchor.getBoundingClientRect();
    const view = scroller.getBoundingClientRect();
    const offset = cell.right - view.left + scroller.scrollLeft;
    scroller.scrollLeft = Math.min(furthest, offset - scroller.clientWidth);
  }, [anchorDate]);

  // One stretchable column per week so the grid fills its container's full
  // width; cells stay square via `aspect-square`. The floor matters more than
  // the ceiling: with 53 columns and a 4px gap, `minmax(0, …)` leaves the gaps
  // eating three quarters of a phone's width and collapses cells to ~1px, far
  // too small to press. Below the floor the grid scrolls instead of shrinking.
  // The floor itself comes from `--heatmap-cell` so it can differ by breakpoint.
  const columns = `repeat(${weeks.length}, minmax(var(--heatmap-cell), 1fr))`;

  return (
    <div className="flex w-full flex-col gap-2">
      {/* Both rows share `columns`, so they stay column-aligned inside the one
          scroller. The caption sits outside it and stays put while you scroll.
          The padding is clearance, not spacing: `overflow-x` resolves the
          vertical axis to `auto` as well, which would otherwise crop the hover
          scale and focus ring on the edge cells.

          A thumb needs more than a cursor does, so phones get the larger floor
          and scroll. From `sm` up the floor sits under the width a desktop card
          settles at, leaving those layouts filling their container as before. */}
      <div
        className="flex flex-col gap-2 overflow-x-auto p-1.5 [--heatmap-cell:16px] sm:[--heatmap-cell:10px]"
        ref={scrollerRef}
      >
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
                modelDisplayNames={modelDisplayNames}
                onPreview={setPreview}
                today={today}
                // biome-ignore lint/suspicious/noArrayIndexKey: grid position is the identity
                key={`${weekIndex}-${dayIndex}`}
              />
            )),
          )}
        </div>
      </div>

      {/* Reserved height, so swapping days never shifts the layout. Narrow
          screens need two lines for the same caption, hence the breakpoint. */}
      <p className="min-h-10 text-sm sm:min-h-5">
        {preview ? (
          <>
            <span className="font-medium">
              {format(parseISO(preview.date), "d MMM yyyy")}
            </span>
            <span className="text-muted">
              {" · "}
              {formatTokens(preview.totals.tokens)} tokens ·{" "}
              {formatCost(preview.totals.cost)} · select for details
            </span>
          </>
        ) : (
          <span className="text-muted">Select any day for its breakdown.</span>
        )}
      </p>
    </div>
  );
}

function Cell({
  cell,
  modelDisplayNames,
  onPreview,
  today,
}: {
  cell: HeatmapCell;
  modelDisplayNames: Record<string, string>;
  onPreview: (day: DayContribution | null) => void;
  today: string | null;
}) {
  const day = cell.contribution;

  // Padding slot outside the calendar year: render a plain square so only real
  // days expose activity stats.
  if (!day) {
    return <div className="aspect-square w-full rounded-sm bg-transparent" />;
  }

  // Future days carry no data yet; keep the base swatch so the year grid stays
  // visually complete, but skip the popover and hover affordances.
  if (today && day.date > today) {
    return (
      <div
        className={cn("aspect-square w-full rounded-sm", INTENSITY_CLASSES[0])}
        data-date={day.date}
      />
    );
  }

  const label = format(parseISO(day.date), "d MMM yyyy");
  const isToday = day.date === today;
  const heading = isToday ? `Today, ${label}` : label;

  return (
    <Popover>
      <Popover.Trigger
        aria-label={`${isToday ? "Today, " : ""}${label}: ${formatTokens(day.totals.tokens)} tokens, ${formatCost(day.totals.cost)}, ${formatNumber(day.totals.messages)} messages`}
        // Scroll anchor for the grid; see the effect in HeatmapGridClient.
        data-date={day.date}
        onBlur={() => onPreview(null)}
        onFocus={() => onPreview(day)}
        onPointerEnter={() => onPreview(day)}
        onPointerLeave={() => onPreview(null)}
        className={cn(
          "aspect-square w-full cursor-pointer rounded-sm transition duration-150 ease-out hover:scale-125 hover:ring-2 hover:ring-accent/60 hover:ring-offset-1 hover:ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          INTENSITY_CLASSES[day.intensity],
          isToday &&
            "ring-2 ring-primary/70 ring-offset-1 ring-offset-background",
        )}
      />
      {/* Sized to its content (capped), not a fixed width: the figures row is
          the widest thing here and a five-figure cost would otherwise spill. */}
      <Popover.Content className="w-max max-w-72" offset={8}>
        <Popover.Dialog className="flex flex-col gap-3">
          <Popover.Heading className="text-sm">{heading}</Popover.Heading>

          <dl className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Stat
              icon={DollarCircleIcon}
              label="API equivalent"
              value={formatCost(day.totals.cost)}
            />
            <Stat
              icon={DatabaseIcon}
              label="Tokens"
              value={formatTokens(day.totals.tokens)}
            />
            <Stat
              icon={BubbleChatIcon}
              label="Messages"
              value={formatNumber(day.totals.messages)}
            />
          </dl>

          <ModelRows
            displayNames={modelDisplayNames}
            models={day.models}
            total={day.totals.tokens}
          />
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}

/** Icon-led figure: the icon carries the meaning, the label is for readers. */
function Stat({
  icon,
  label,
  value,
}: {
  icon: IconSvgElement;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <HugeiconsIcon
        className="size-4 shrink-0 text-muted"
        icon={icon}
        strokeWidth={1.5}
      />
      <dt className="sr-only">{label}</dt>
      <dd className="whitespace-nowrap text-sm">{value}</dd>
    </div>
  );
}

/**
 * What ran that day: the biggest models by tokens, with their token counts.
 * Names come from the model registry when it has one, so a row reads
 * "Claude Opus 4.5" rather than a routing slug.
 */
function ModelRows({
  displayNames,
  models,
  total,
}: {
  displayNames: Record<string, string>;
  models: ModelDayBreakdown[];
  total: number;
}) {
  if (models.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {models.map((model) => (
        // Measured against the whole day, so bars stopping short of full width
        // is itself the signal that models beyond the top few were trimmed.
        <Meter
          key={model.model}
          size="sm"
          value={total > 0 ? (model.tokens / total) * 100 : 0}
          valueLabel={formatTokens(model.tokens)}
        >
          <Label className="truncate text-muted text-xs">
            {displayNames[model.model] ?? model.model}
          </Label>
          <Meter.Output className="whitespace-nowrap text-xs" />
          <Meter.Track>
            <Meter.Fill />
          </Meter.Track>
        </Meter>
      ))}
    </div>
  );
}
