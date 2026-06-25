import type { ReactNode } from "react";
import { Eyebrow } from "./eyebrow";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description?: ReactNode;
}

/** Standard notebook page header: mono eyebrow, display title, body description. */
export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 className="font-display font-semibold text-4xl text-foreground tracking-tight sm:text-5xl">
        {title}
      </h1>
      {description && (
        <p className="max-w-2xl text-balance text-lg text-muted leading-relaxed">
          {description}
        </p>
      )}
    </header>
  );
}
