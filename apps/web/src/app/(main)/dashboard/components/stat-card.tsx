import { AnimatedCounter } from "@/app/components/home/animated-counter";
import { formatStat } from "@/lib/format-stat";

interface StatCardProps {
  label: string;
  value: number;
  note?: string;
  animate?: boolean;
  compact?: boolean;
}

function renderValue({
  value,
  animate,
  compact,
}: Omit<StatCardProps, "label">) {
  if (animate) {
    return <AnimatedCounter value={value} compact={compact} />;
  }

  return compact ? formatStat(value) : value.toLocaleString("en-SG");
}

export function StatCard({
  label,
  value,
  note,
  animate,
  compact,
}: StatCardProps) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-default/50 p-5">
      <span className="font-medium text-muted text-sm">{label}</span>
      <span className="font-bold font-mono text-3xl tracking-tight">
        {renderValue({ value, animate, compact })}
      </span>
      {note && <span className="text-muted text-xs">{note}</span>}
    </div>
  );
}
