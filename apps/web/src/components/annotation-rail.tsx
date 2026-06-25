import { cn } from "@heroui/react";
import type { ReactNode } from "react";

interface AnnotationRailProps {
  children: ReactNode;
  className?: string;
}

/**
 * The Engineering Notebook signature: a monospace metadata strip that tags
 * content like margin notes in a lab log. Children are separated automatically
 * by a middot, so callers just list the parts:
 *
 *   <AnnotationRail>
 *     <time>2026-06-24</time>
 *     <span>4 min</span>
 *     <span>#nextjs</span>
 *   </AnnotationRail>
 */
export function AnnotationRail({ children, className }: AnnotationRailProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center font-mono text-muted text-xs tabular-nums",
        "[&>*+*]:before:mx-2 [&>*+*]:before:text-border [&>*+*]:before:content-['\\00B7']",
        className,
      )}
    >
      {children}
    </div>
  );
}
