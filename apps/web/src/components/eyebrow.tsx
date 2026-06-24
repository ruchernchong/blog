import { cn } from "@heroui/react";
import type { ReactNode } from "react";

interface EyebrowProps {
  children: ReactNode;
  className?: string;
}

/**
 * A small monospace section label, preceded by a signal-coloured tick. Used as
 * an eyebrow above section headings throughout the notebook.
 */
export function Eyebrow({ children, className }: EyebrowProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-mono text-muted text-xs uppercase tracking-wide",
        className,
      )}
    >
      <span aria-hidden className="text-accent">
        ::
      </span>
      {children}
    </span>
  );
}
