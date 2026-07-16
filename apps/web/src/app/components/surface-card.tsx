import { cn } from "@heroui/react";
import type { ReactNode } from "react";

interface SurfaceCardProps {
  children: ReactNode;
  width?: "default" | "wide";
  className?: string;
}

export function SurfaceCard({
  children,
  width = "default",
  className,
}: SurfaceCardProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full rounded-3xl bg-surface px-6 py-10 shadow-(--surface-shadow) sm:px-14",
        width === "wide" ? "max-w-[960px]" : "max-w-[680px]",
        className,
      )}
    >
      {children}
    </div>
  );
}
