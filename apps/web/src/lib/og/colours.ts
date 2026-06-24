/**
 * OG image colour tokens (Satori-compatible hex values)
 *
 * Satori (the library behind next/og) doesn't support OKLCH, so these are hex
 * conversions of the Engineering Notebook palette — a monochrome paper/ink base
 * with a single coral signal accent.
 */
export const OG_COLOURS = {
  /** --accent: oklch(0.6 0.18 25) — coral signal */
  primary: "#D4513B",

  /** white on accent */
  primaryForeground: "#FFFFFF",

  /** --background: oklch(0.9702 0 0) — paper */
  background: "#F5F5F5",

  /** --foreground / --eclipse — ink */
  foreground: "#18181B",

  /** --muted / graphite */
  mutedForeground: "#71717A",

  /** Accent-derived gradient (light → dark coral) */
  gradient: {
    start: "#E5634D",
    mid1: "#C25840",
    mid2: "#A25939",
    end: "#D4513B",
  },

  /**
   * Heatmap intensity ramp (index = intensity 0–4), light → dark.
   *
   * 0 → --default (neutral)   1–4 → accent-derived corals (light → dark)
   */
  chartRamp: ["#EBEBEC", "#E8806A", "#D4513B", "#A13527", "#6B1B0F"] as const,
} as const;

/**
 * CSS gradient string for OG image backgrounds.
 * 135-degree diagonal in the coral signal accent.
 */
export const OG_ACCENT_GRADIENT = `linear-gradient(135deg, ${OG_COLOURS.gradient.start} 0%, ${OG_COLOURS.gradient.mid1} 35%, ${OG_COLOURS.gradient.mid2} 65%, ${OG_COLOURS.gradient.end} 100%)`;
