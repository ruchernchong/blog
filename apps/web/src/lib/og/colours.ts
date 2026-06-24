/**
 * OG image colour tokens (Satori-compatible hex values)
 *
 * Satori (the library behind next/og) doesn't support OKLCH, so these are hex
 * conversions of the Engineering Notebook palette — the HeroUI default theme
 * (neutral paper/ink) with the blue signal accent.
 */
export const OG_COLOURS = {
  /** --accent: oklch(0.6204 0.195 253.83) — blue signal */
  primary: "#0485F7",

  /** white on accent */
  primaryForeground: "#FFFFFF",

  /** --background: oklch(0.9702 0 0) — paper */
  background: "#F5F5F5",

  /** --foreground / --eclipse — ink */
  foreground: "#18181B",

  /** --muted / graphite */
  mutedForeground: "#71717A",

  /** Accent-derived gradient (light → dark blue) */
  gradient: {
    start: "#42ACFF",
    mid1: "#0485F7",
    mid2: "#005FCE",
    end: "#0038A5",
  },

  /**
   * Heatmap intensity ramp (index = intensity 0–4), light → dark.
   *
   * 0 → --default (neutral)   1–4 → accent-derived blues (light → dark)
   */
  chartRamp: ["#EBEBEC", "#42ACFF", "#0485F7", "#005FCE", "#0038A5"] as const,
} as const;

/**
 * CSS gradient string for OG image backgrounds.
 * 135-degree diagonal in the blue signal accent.
 */
export const OG_ACCENT_GRADIENT = `linear-gradient(135deg, ${OG_COLOURS.gradient.start} 0%, ${OG_COLOURS.gradient.mid1} 35%, ${OG_COLOURS.gradient.mid2} 65%, ${OG_COLOURS.gradient.end} 100%)`;
