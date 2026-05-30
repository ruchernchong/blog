import { cn } from "@heroui/react";
import type { ReactNode } from "react";
import { Typography } from "@/components/typography";

interface PageTitleProps {
  title: string;
  description?: string;
  className?: string;
  animate?: boolean;
  icon?: ReactNode;
}

export function PageTitle({
  title,
  description,
  className,
  animate = true,
  icon,
}: PageTitleProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-4">
        {icon}
        <Typography
          variant="h1"
          className={cn(animate && "animate-slide-in-left")}
        >
          {title}
        </Typography>
      </div>
      {description && (
        <Typography
          variant="body-lg"
          className={cn(
            "text-muted",
            animate && "animate-slide-in-left-delayed",
          )}
        >
          {description}
        </Typography>
      )}
    </div>
  );
}
