/**
 * Intensity bucket (0…4) → cell colour for the contribution heatmap. Level 0 is
 * a faint neutral (`bg-default`, which adapts in dark mode) for empty/zero days;
 * levels 1–4 climb the coral `--chart-*` ramp (medium-light → dark, all derived
 * from `--accent`) so the lowest activity already reads as coral and stays clear
 * of the empty cells. Plain module (no "use client") so both the server shell
 * (legend) and the client grid can import the array.
 *
 * Note: this theme has no `primary` token — coral is `--accent`, exposed as the
 * `--chart-*` steps — so we use those, not `bg-primary` (which falls to grey).
 */
export const INTENSITY_CLASSES = [
  "bg-default",
  "bg-[var(--chart-4)]",
  "bg-[var(--chart-3)]",
  "bg-[var(--chart-2)]",
  "bg-[var(--chart-1)]",
] as const;
