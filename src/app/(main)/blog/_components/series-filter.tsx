"use client";

import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { parseAsString, useQueryState } from "nuqs";
import { cn } from "@/lib/utils";

interface SeriesFilterProps {
  seriesTitle?: string;
  className?: string;
}

export function SeriesFilter({ seriesTitle, className }: SeriesFilterProps) {
  const [activeSeries, setActiveSeries] = useQueryState(
    "series",
    parseAsString.withOptions({ shallow: false }),
  );

  if (!activeSeries) return null;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-muted-foreground text-sm">
        Filtering by series:
      </span>
      <button
        type="button"
        onClick={() => setActiveSeries(null)}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 font-medium text-primary-foreground text-sm transition-all duration-200 hover:bg-primary/90"
      >
        {seriesTitle ?? activeSeries}
        <HugeiconsIcon icon={Cancel01Icon} size={14} />
      </button>
    </div>
  );
}
