import { Card, Typography } from "@heroui/react";
import { formatNumber } from "@workspace/usage/format";
import { type EffortSummary, effortLevelLabel } from "@workspace/usage/types";

interface UsageEffortLevelsProps {
  className?: string;
  effort: EffortSummary;
}

/** Cycle through HeroUI chart tokens for open-ended effort level lists. */
const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

const CHART_COLOR_CLASSES = [
  "bg-[var(--chart-1)]",
  "bg-[var(--chart-2)]",
  "bg-[var(--chart-3)]",
  "bg-[var(--chart-4)]",
  "bg-[var(--chart-5)]",
] as const;

/**
 * All-time session effort distribution. Counts are sessions (dominant effort
 * per session), matching AgentUsage's EffortLevelsView pattern of per-level
 * horizontal percentage rows.
 */
export function UsageEffortLevels({
  className,
  effort,
}: UsageEffortLevelsProps) {
  const { levels, classifiedSessionCount, unclassifiedSessionCount } = effort;
  const totalSessions = classifiedSessionCount + unclassifiedSessionCount;
  const caption =
    unclassifiedSessionCount === 0
      ? `All ${formatNumber(classifiedSessionCount)} sessions classified.`
      : `${formatNumber(classifiedSessionCount)} of ${formatNumber(totalSessions)} sessions classified.`;

  return (
    <Card className={className}>
      <Card.Header>
        <Card.Title>Effort levels</Card.Title>
        <Card.Description>{caption}</Card.Description>
      </Card.Header>
      <Card.Content>
        <ul className="flex flex-col gap-4">
          {levels.map((row, index) => {
            const pct =
              classifiedSessionCount > 0
                ? (row.sessionCount / classifiedSessionCount) * 100
                : 0;
            const colorClass =
              CHART_COLOR_CLASSES[index % CHART_COLOR_CLASSES.length];
            const color = CHART_COLORS[index % CHART_COLORS.length];

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
      </Card.Content>
    </Card>
  );
}
