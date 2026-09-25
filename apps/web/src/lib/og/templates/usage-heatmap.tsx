import type { HeatmapLayout } from "@workspace/usage/heatmap-layout";
import type { UsageNarrativePart } from "@workspace/usage/narrative";
import { OG_COLOURS } from "../colours";
import { OG_CONFIG } from "../config";

const PADDING_X = 64;
const PADDING_Y = 56;
const CONTENT_WIDTH = OG_CONFIG.width - PADDING_X * 2;
/** Caps cell growth so a short history doesn't push the footer off the image. */
const MAX_STRIDE = 28;

interface UsageHeatmapProps {
  layout: HeatmapLayout;
  /** Small coral label above the headline, e.g. "Usage". */
  eyebrow: string;
  /** The page's generated summary sentence; highlighted parts use the accent. */
  headline: UsageNarrativePart[];
  stats?: UsageHeatmapStat[];
}

interface UsageHeatmapStat {
  label: string;
  value: string;
}

/**
 * OG image template for the Usage page: mirrors the page hero, with the
 * generated summary sentence as the headline over the heatmap, with the
 * figures the sentence leaves out beside the eyebrow.
 *
 * Full bleed rather than the shared coral-framed `Layout`: the headline accent
 * and the heatmap already carry the coral, so a coral frame would compete with
 * them and cost the heatmap its width.
 *
 * Renders the activity heatmap using Satori-compatible inline styles only —
 * no CSS variables, no Tailwind, flexbox only (no grid).
 */
export function UsageHeatmap({
  layout,
  eyebrow,
  headline,
  stats,
}: Readonly<UsageHeatmapProps>) {
  // Size cells so the heatmap spans the content width: a partial year gets
  // larger cells, a full 53-week year shrinks to fit.
  const GAP = 3;
  const STRIDE = Math.min(
    MAX_STRIDE,
    Math.floor(CONTENT_WIDTH / Math.max(layout.weeks.length, 1)),
  );
  const CELL = STRIDE - GAP;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: `${PADDING_Y}px ${PADDING_X}px`,
        background: OG_COLOURS.primaryForeground,
        fontFamily: OG_CONFIG.fontFamily,
      }}
    >
      {/* Eyebrow + headline */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
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
          {stats && stats.length > 0 && (
            <div style={{ display: "flex", gap: 24 }}>
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  style={{ display: "flex", alignItems: "baseline", gap: 8 }}
                >
                  <div
                    style={{
                      color: OG_COLOURS.foreground,
                      fontSize: 22,
                      fontWeight: 700,
                    }}
                  >
                    {stat.value}
                  </div>
                  <div
                    style={{
                      color: OG_COLOURS.mutedForeground,
                      fontSize: 17,
                      fontWeight: 600,
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Satori has no inline layout, so accent runs inside running text
            overlap. Wrap word by word instead: each word is a flex item, and a
            word keeps its trailing punctuation even when that is unaccented. */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            columnGap: 10,
            fontSize: 38,
            fontWeight: 700,
            color: OG_COLOURS.foreground,
            lineHeight: 1.15,
            letterSpacing: -1,
            maxWidth: "95%",
          }}
        >
          {toWords(headline).map((word, wordIndex) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: words are a fixed, ordered template
            <div key={wordIndex} style={{ display: "flex" }}>
              {word.map((run, runIndex) => (
                <span
                  // biome-ignore lint/suspicious/noArrayIndexKey: runs are a fixed, ordered template
                  key={runIndex}
                  style={run.highlight ? { color: OG_COLOURS.primary } : {}}
                >
                  {run.text}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 36 }} />

      {/* Month labels */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          position: "relative",
          height: 18,
        }}
      >
        {layout.monthLabels.map(({ label, weekIndex }) => (
          <div
            key={label}
            style={{
              position: "absolute",
              left: weekIndex * STRIDE,
              fontSize: 15,
              fontWeight: 500,
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
                    borderRadius: 4,
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

      <div style={{ flex: 1 }} />

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          color: OG_COLOURS.mutedForeground,
          fontSize: 20,
          fontWeight: 600,
        }}
      >
        {OG_CONFIG.siteUrl}
      </div>
    </div>
  );
}

/** Splits narrative parts into words, each a list of runs sharing one accent. */
function toWords(parts: UsageNarrativePart[]): UsageNarrativePart[][] {
  const words: UsageNarrativePart[][] = [];
  let word: UsageNarrativePart[] = [];

  for (const { text, highlight } of parts) {
    text.split(" ").forEach((chunk, index) => {
      if (index > 0 && word.length > 0) {
        words.push(word);
        word = [];
      }
      if (chunk) {
        word.push({ text: chunk, highlight });
      }
    });
  }

  if (word.length > 0) {
    words.push(word);
  }

  return words;
}
