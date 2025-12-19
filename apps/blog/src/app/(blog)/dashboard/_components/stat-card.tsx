import type { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: number;
}

export function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_-10px_oklch(0.60_0.18_25/0.4)]">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="font-medium text-xs uppercase tracking-wider">
          {label}
        </span>
      </div>
      <span className="font-bold text-4xl">{value.toLocaleString()}</span>
    </div>
  );
}
