"use client";

import { cn } from "@heroui/react";

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
  <div className={cn("space-y-2", className)}>
    <h1
      className={cn(
        "text-foreground text-3xl font-bold tracking-tight sm:text-4xl",
        animate && "animate-slide-in-left",
      )}
    >
      {title}
    </h1>
    {description && (
      <h2
        className={cn(
          "text-foreground-500 text-lg",
          animate && "animate-slide-in-left-delayed",
        )}
      >
        {description}
      </h2>
    )}
  </div>
);
