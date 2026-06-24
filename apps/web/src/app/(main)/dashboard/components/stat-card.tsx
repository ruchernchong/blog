import { Card } from "@heroui/react";
import type { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: number;
}

export function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <Card className="gap-4">
      <div className="flex items-center gap-2 text-muted">
        {icon}
        <span className="font-mono text-xs uppercase tracking-wide">
          {label}
        </span>
      </div>
      <span className="font-mono text-4xl text-foreground tabular-nums leading-none">
        {value.toLocaleString()}
      </span>
    </Card>
  );
}
