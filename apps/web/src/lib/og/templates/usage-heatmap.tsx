import type { HeatmapLayout } from "@workspace/usage/heatmap-layout";
import { OG_COLOURS } from "../colours";
import { Layout } from "./layout";

interface UsageHeatmapProps {
  layout: HeatmapLayout;
  /** Small coral label above the headline, e.g. "Usage". */
  eyebrow: string;
  /** The page's generated summary sentence. */
  headline: string;
  stats?: UsageHeatmapStat[];
}

interface UsageHeatmapStat {
  label: string;
  value: string;
}

/**
 * OG image template for the Usage page: mirrors the page hero, with the
 * generated summary sentence as the headline over the heatmap and figures.
 *
 * Renders the activity heatmap using Satori-compatible inline styles only —
 * no CSS variables, no Tailwind, flexbox only (no grid).
 *
 * Cell stride: 16px cell + 3px gap = 19px per column.
 */
export function UsageHeatmap({
  layout,
  eyebrow,
  headline,
  stats,
}: UsageHeatmapProps) {
  const CELL = 16;
  const GAP = 3;
  const STRIDE = CELL + GAP;

  return (
    <Layout>
      {/* Eyebrow + headline */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: OG_COLOURS.primary,
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            fontSize: 38,
            fontWeight: 700,
            color: OG_COLOURS.foreground,
            lineHeight: 1.15,
            letterSpacing: -1,
            maxWidth: "95%",
            // The sentence carries model names of any length; cap it so the
            // heatmap and figures below always fit in the fixed 1200x630.
            display: "block",
            lineClamp: 3,
          }}
        >
          {headline}
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

      {stats && stats.length > 0 && (
        <>
          <div style={{ height: 30 }} />
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              width: "100%",
              borderTop: `1px solid ${OG_COLOURS.chartRamp[0]}`,
              paddingTop: 22,
            }}
          >
            {stats.map((stat, index) => {
              const align =
                index === 0
                  ? "flex-start"
                  : index === stats.length - 1
                    ? "flex-end"
                    : "center";
              const textAlign =
                index === 0
                  ? "left"
                  : index === stats.length - 1
                    ? "right"
                    : "center";

              return (
                <div
                  key={stat.label}
                  style={{
                    display: "flex",
                    flex: 1,
                    flexDirection: "column",
                    alignItems: align,
                    gap: 6,
                    textAlign,
                  }}
                >
                  <div
                    style={{
                      color: OG_COLOURS.mutedForeground,
                      fontSize: 17,
                      fontWeight: 600,
                      lineHeight: 1.1,
                    }}
                  >
                    {stat.label}
                  </div>
                  <div
                    style={{
                      color: OG_COLOURS.foreground,
                      fontSize: 31,
                      fontWeight: 700,
                      lineHeight: 1,
                    }}
                  >
                    {stat.value}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Layout>
  );
}
