import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  className?: string;
}

export const MetricCard = ({
  title,
  value,
  icon,
  className,
}: MetricCardProps) => (
  <Card className={cn("p-6", className)}>
    <CardContent className="p-0">
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-bold text-4xl">{value}</span>
        </div>
        <p className="text-muted-foreground text-sm">{title}</p>
      </div>
    </CardContent>
  </Card>
);
