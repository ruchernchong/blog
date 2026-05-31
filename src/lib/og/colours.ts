/**
 * OG image colour tokens (Satori-compatible hex values)
 *
 * Converted from OKLCH values in styles.css since Satori
 * (the library behind next/og) doesn't support OKLCH.
 *
 * @see apps/blog/src/app/(blog)/styles.css
 */
export const OG_COLOURS = {
  /** --primary: oklch(0.6 0.18 25) */
  primary: "#D4513B",

  /** --primary-foreground: oklch(0.98 0.01 25) */
  primaryForeground: "#FDF7F6",

  /** --background: oklch(0.985 0.005 90) */
  background: "#FDFCFA",

  /** --foreground: oklch(0.15 0.01 270) */
  foreground: "#1A1A1E",

  /** --muted-foreground: oklch(0.45 0.01 270) */
  mutedForeground: "#6B6B70",

  /** Chart colours for gradient */
  gradient: {
    /** --chart-1: oklch(0.65 0.18 25) */
    start: "#E5634D",
    /** --chart-2: oklch(0.55 0.15 35) */
    mid1: "#C25840",
    /** --chart-3: oklch(0.5 0.12 45) */
    mid2: "#A25939",
    /** --primary: oklch(0.6 0.18 25) */
    end: "#D4513B",
  },

  /**
   * Heatmap intensity ramp (index = intensity 0–4).
   *
   * Satori cannot evaluate CSS variables or OKLCH relative-colour expressions,
   * so --chart-1 through --chart-4 and --default are pre-converted to hex here.
   *
   * 0 → --default  oklch(0.94 0.001 286)
   * 1 → --chart-4  oklch(0.72 0.18 25)
   * 2 → --chart-3  oklch(0.60 0.18 25)  (= --accent)
   * 3 → --chart-2  oklch(0.48 0.18 25)
   * 4 → --chart-1  oklch(0.36 0.18 25)
   */
  chartRamp: ["#E9E9EA", "#E8806A", "#D4513B", "#A13527", "#6B1B0F"] as const,
} as const;

/**
 * CSS gradient string for OG image backgrounds
 * 135-degree angle for diagonal coral gradient
 */
export const OG_CORAL_GRADIENT = `linear-gradient(135deg, ${OG_COLOURS.gradient.start} 0%, ${OG_COLOURS.gradient.mid1} 35%, ${OG_COLOURS.gradient.mid2} 65%, ${OG_COLOURS.gradient.end} 100%)`;
