import { Card, cn } from "@heroui/react";
import { INTENSITY_CLASSES } from "@/lib/usage/heatmap-intensity";
import { buildHeatmapLayout } from "@/lib/usage/heatmap-layout";
import type { DayContribution } from "@/lib/usage/types";
import { HeatmapGridClient } from "./heatmap-grid.client";

interface UsageHeatmapProps {
  contributions: DayContribution[];
}

/**
 * Server component: the card shell + pure layout for the contribution heatmap.
 * `buildHeatmapLayout` is pure and its output serializable, so only the
 * interactive grid (tooltips) is a client leaf.
 */
export function UsageHeatmap({ contributions }: UsageHeatmapProps) {
  const layout = buildHeatmapLayout(contributions);

  return (
    <Card>
      <Card.Header>
        <Card.Title>Activity</Card.Title>
        <Card.Description>Daily token usage across all agents</Card.Description>
      </Card.Header>
      <Card.Content>
        {layout.weeks.length === 0 ? (
          <p className="text-muted text-sm">No activity yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            <HeatmapGridClient layout={layout} />
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
        )}
      </Card.Content>
    </Card>
  );
}
