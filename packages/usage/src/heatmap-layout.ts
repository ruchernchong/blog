import { format, getDay, parseISO } from "date-fns";
import type { DayContribution } from "./types";

/**
 * Pure layout for the GitHub-style contribution heatmap.
 *
 * Turns a dense (gap-filled) day array into columns of weeks × 7 weekday rows,
 * with a leading offset so the first day lands on its real weekday, trailing
 * padding to complete the final week, and month-label positions. Kept pure (no
 * DOM, no React) so the client component just maps it to `<rect>`s and it can be
 * unit-tested directly.
 *
 * Weeks start on Sunday (row 0 = Sunday), matching GitHub.
 */

export interface HeatmapCell {
  /** YYYY-MM-DD, or null for a padding cell. */
  date: string | null;
  contribution: DayContribution | null;
}

export interface HeatmapMonthLabel {
  /** Short month name, e.g. "Jan". */
  label: string;
  /** Column index of the week where this month first appears. */
  weekIndex: number;
}

export interface HeatmapLayout {
  /** Columns; each inner array is 7 cells (Sun…Sat). */
  weeks: HeatmapCell[][];
  monthLabels: HeatmapMonthLabel[];
}

const PADDING_CELL: HeatmapCell = { date: null, contribution: null };

export function buildHeatmapLayout(days: DayContribution[]): HeatmapLayout {
  if (days.length === 0) {
    return { weeks: [], monthLabels: [] };
  }

  const cells: HeatmapCell[] = days.map((day) => ({
    date: day.date,
    contribution: day,
  }));

  // Leading padding so the first day sits in its real weekday row.
  const firstWeekday = getDay(parseISO(days[0].date));
  const leading: HeatmapCell[] = Array.from(
    { length: firstWeekday },
    () => PADDING_CELL,
  );

  const all = [...leading, ...cells];
  // Trailing padding to complete the last week column.
  while (all.length % 7 !== 0) {
    all.push(PADDING_CELL);
  }

  const weeks: HeatmapCell[][] = [];
  for (let i = 0; i < all.length; i += 7) {
    weeks.push(all.slice(i, i + 7));
  }

  // A month label sits on the first week column that introduces a new month.
  const monthLabels: HeatmapMonthLabel[] = [];
  let lastMonth = -1;
  weeks.forEach((week, weekIndex) => {
    const firstReal = week.find((cell) => cell.date);
    if (!firstReal?.date) return;
    const parsed = parseISO(firstReal.date);
    const month = parsed.getMonth();
    if (month !== lastMonth) {
      monthLabels.push({ label: format(parsed, "MMM"), weekIndex });
      lastMonth = month;
    }
  });

  return { weeks, monthLabels };
}
