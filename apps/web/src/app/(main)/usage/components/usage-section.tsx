import { cn } from "@heroui/react";
import type { ReactNode } from "react";

interface UsageSectionProps {
  /** Anchor id; also labels the section for assistive tech. */
  id: string;
  title: string;
  description?: string;
  className?: string;
  children: ReactNode;
}

/**
 * Unboxed page section for the editorial half of `/usage`: a heading and an
 * optional one-line description over full-width content. Sections are
 * separated by whitespace rather than card borders.
 */
export function UsageSection({
  id,
  title,
  description,
  className,
  children,
}: Readonly<UsageSectionProps>) {
  const headingId = `${id}-heading`;

  return (
    <section
      aria-labelledby={headingId}
      className={cn("flex scroll-mt-24 flex-col gap-6", className)}
      id={id}
    >
      <div className="flex flex-col gap-2">
        <h2
          className="font-semibold text-2xl tracking-tight sm:text-3xl"
          id={headingId}
        >
          {title}
        </h2>
        {description && (
          <p className="max-w-2xl text-muted leading-relaxed">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}
