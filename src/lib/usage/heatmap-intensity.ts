/**
 * Intensity bucket (0…4) → cell colour for the contribution heatmap. Coral
 * primary opacity steps so it reads as a single-hue heatmap and stays within the
 * design language. Plain module (no "use client") so both the server shell
 * (legend) and the client grid can import the real array.
 */
export const INTENSITY_CLASSES = [
  "bg-muted",
  "bg-primary/25",
  "bg-primary/45",
  "bg-primary/70",
  "bg-primary",
] as const;
