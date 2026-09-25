import { cn, Typography } from "@heroui/react";
import { formatNumber } from "@workspace/usage/format";
import { type EffortSummary, effortLevelLabel } from "@workspace/usage/types";

interface UsageEffortLevelsProps {
  className?: string;
  effort: EffortSummary;
}

/** Cycle through HeroUI chart tokens for open-ended effort level lists. */
const CHART_COLORS = [
  { color: "var(--chart-1)", colorClass: "bg-[var(--chart-1)]" },
  { color: "var(--chart-2)", colorClass: "bg-[var(--chart-2)]" },
  { color: "var(--chart-3)", colorClass: "bg-[var(--chart-3)]" },
  { color: "var(--chart-4)", colorClass: "bg-[var(--chart-4)]" },
  { color: "var(--chart-5)", colorClass: "bg-[var(--chart-5)]" },
] as const;

/**
 * All-time session effort distribution. Counts are sessions (dominant effort
 * per session), matching AgentUsage's EffortLevelsView pattern of per-level
 * horizontal percentage rows.
 */
export function UsageEffortLevels({
  className,
  effort,
}: Readonly<UsageEffortLevelsProps>) {
  const { levels, classifiedSessionCount, unclassifiedSessionCount } = effort;
  const totalSessions = classifiedSessionCount + unclassifiedSessionCount;
  const caption =
    unclassifiedSessionCount === 0
      ? `All ${formatNumber(classifiedSessionCount)} sessions classified.`
      : `${formatNumber(classifiedSessionCount)} of ${formatNumber(totalSessions)} sessions classified.`;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-col gap-2">
        <h3 className="font-semibold text-xl">Effort levels</h3>
        <p className="text-muted text-sm">{caption}</p>
      </div>
      <ul className="flex flex-col gap-4">
        {levels.map((row, index) => {
          const pct =
            classifiedSessionCount > 0
              ? (row.sessionCount / classifiedSessionCount) * 100
              : 0;
          const { color, colorClass } =
            CHART_COLORS[index % CHART_COLORS.length];

          return (
            <li className="flex flex-col gap-2" key={row.level}>
              <div className="flex items-baseline justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`size-3 shrink-0 rounded-full ${colorClass}`}
                  />
                  <Typography type="body-sm">
                    {effortLevelLabel(row.level)}
                  </Typography>
                </div>
                <Typography color="muted" type="body-sm">
                  {formatNumber(row.sessionCount)} ({Math.round(pct)}%)
                </Typography>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-default">
                <div
                  className="h-full rounded-full transition-[width]"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
