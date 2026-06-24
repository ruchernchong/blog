import { cn } from "@heroui/react";
import type { ReactNode } from "react";

interface StatReadoutProps {
  label: string;
  value: ReactNode;
  className?: string;
}

/**
 * A single instrument readout: a large tabular-monospace value over a small
 * monospace label. Value-first (primary), label below.
 */
export function StatReadout({ label, value, className }: StatReadoutProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="font-mono text-3xl text-foreground tabular-nums leading-none">
        {value}
      </span>
      <span className="font-mono text-muted text-xs uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
}
