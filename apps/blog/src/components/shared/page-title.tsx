import type { ReactNode } from "react";
import { Typography } from "@/components/typography";
import { cn } from "@/lib/utils";

interface PageTitleProps {
  title: string;
  description?: string;
  className?: string;
  animate?: boolean;
  icon?: ReactNode;
  action?: ReactNode;
}

export const PageTitle = ({
  title,
  description,
  className,
  animate = true,
  icon,
  action,
}: PageTitleProps) => (
  <div className={cn("flex flex-col gap-2", className)}>
    <div className="flex items-center gap-4">
      {icon}
      <Typography
        variant="h1"
        className={cn(animate && "animate-slide-in-left")}
      >
        {title}
      </Typography>
      {action}
    </div>
    {description && (
      <Typography
        variant="body-lg"
        className={cn(
          "text-muted-foreground",
          animate && "animate-slide-in-left-delayed",
        )}
      >
        {description}
      </Typography>
    )}
  </div>
);
