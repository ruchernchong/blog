import { Card, CardContent } from "@/components/card";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

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
      <div className="flex flex-col items-center space-y-2">
        <div className="flex items-center space-x-2">
          {icon}
          <span className="text-4xl font-bold">{value}</span>
        </div>
        <p className="text-muted-foreground text-sm">{title}</p>
      </div>
    </CardContent>
  </Card>
);
