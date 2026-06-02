import type { HeatmapLayout } from "@workspace/usage/heatmap-layout";
import { OG_COLOURS } from "../colours";
import { Layout } from "./layout";

interface UsageHeatmapProps {
  layout: HeatmapLayout;
  title: string;
  description: string;
}

/**
 * OG image template for the Usage page.
 *
 * Renders the activity heatmap using Satori-compatible inline styles only —
 * no CSS variables, no Tailwind, flexbox only (no grid).
 *
 * Cell stride: 16px cell + 3px gap = 19px per column.
 */
export function UsageHeatmap({
  layout,
  title,
  description,
}: UsageHeatmapProps) {
  const CELL = 16;
  const GAP = 3;
  const STRIDE = CELL + GAP;

  return (
    <Layout>
      {/* Title + description */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div
          style={{
            fontSize: 60,
            fontWeight: 700,
            color: OG_COLOURS.foreground,
            lineHeight: 1.1,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 400,
            color: OG_COLOURS.mutedForeground,
            lineHeight: 1.4,
            maxWidth: "90%",
          }}
        >
          {description}
        </div>
      </div>

      <div style={{ height: 36 }} />

      {/* Month labels */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          position: "relative",
          height: 14,
        }}
      >
        {layout.monthLabels.map(({ label, weekIndex }) => (
          <div
            key={label}
            style={{
              position: "absolute",
              left: weekIndex * STRIDE,
              fontSize: 12,
              fontWeight: 400,
              color: OG_COLOURS.mutedForeground,
            }}
          >
            {label}
          </div>
        ))}
      </div>

      <div style={{ height: 8 }} />

      {/* Heatmap grid: weeks as columns, days (Sun–Sat) as rows */}
      <div style={{ display: "flex", flexDirection: "row", gap: GAP }}>
        {layout.weeks.map((week) => {
          const weekKey =
            week.find((c) => c.date)?.date ?? `pad-w${week.length}`;
          return (
            <div
              key={weekKey}
              style={{ display: "flex", flexDirection: "column", gap: GAP }}
            >
              {week.map((cell) => (
                <div
                  key={cell.date ?? `${weekKey}-pad`}
                  style={{
                    width: CELL,
                    height: CELL,
                    borderRadius: 3,
                    background:
                      cell.date === null
                        ? "transparent"
                        : OG_COLOURS.chartRamp[
                            cell.contribution?.intensity ?? 0
                          ],
                  }}
                />
              ))}
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
