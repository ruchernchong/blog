import { formatStat } from "@/lib/format-stat";
import { AnimatedCounter } from "./home/animated-counter";

interface StatFigureProps {
  label: string;
  value: number | string;
  /** Count up from 0 when scrolled into view (numeric values only). */
  animate?: boolean;
  /** Format numeric values with k/M/B suffixes. */
  compact?: boolean;
}

function renderValue({
  value,
  animate,
  compact,
}: Omit<StatFigureProps, "label">) {
  if (typeof value === "string") {
    return value;
  }

  if (animate) {
    return <AnimatedCounter value={value} compact={compact} />;
  }

  return compact ? formatStat(value) : value.toLocaleString("en-SG");
}

export function StatFigure({
  label,
  value,
  animate,
  compact,
}: StatFigureProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-bold font-mono text-2xl tracking-tight">
        {renderValue({ value, animate, compact })}
      </span>
      <span className="text-muted text-sm">{label}</span>
    </div>
  );
}
