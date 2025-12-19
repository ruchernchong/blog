"use client";

import { Typography } from "@/components/typography";
import { cn } from "@/lib/utils";

interface PageTitleProps {
  title: string;
  description?: string;
  className?: string;
  animate?: boolean;
}

export const PageTitle = ({
  title,
  description,
  className,
  animate = true,
}: PageTitleProps) => (
  <div className={cn("flex flex-col gap-2", className)}>
    <Typography
      variant="h1"
      className={cn(animate && "animate-slide-in-left")}
    >
      {title}
    </Typography>
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
