"use client";

import { LibraryIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import { parseAsString, useQueryState } from "nuqs";
import { cn } from "@/lib/utils";

interface SeriesItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  postCount: number;
}

interface SeriesCardsProps {
  series: SeriesItem[];
  className?: string;
}

export function SeriesCards({ series, className }: SeriesCardsProps) {
  const [activeSeries, setActiveSeries] = useQueryState(
    "series",
    parseAsString.withOptions({ shallow: false }),
  );

  const handleSeriesClick = (slug: string) => {
    if (slug === activeSeries) {
      setActiveSeries(null);
    } else {
      setActiveSeries(slug);
    }
  };

  if (series.length === 0) return null;

  return (
    <section className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-center gap-2">
        <HugeiconsIcon icon={LibraryIcon} size={20} className="text-primary" />
        <h2 className="font-semibold text-lg">Series</h2>
      </div>

      <div className="scrollbar-hide -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 md:-mx-0 md:px-0">
        {series.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleSeriesClick(item.slug)}
            className={cn(
              "group relative flex w-64 shrink-0 flex-col gap-4 overflow-hidden rounded-2xl border bg-card p-4 text-left transition-all duration-200 hover:-translate-y-0.5",
              activeSeries === item.slug
                ? "border-primary shadow-lg"
                : "border-border hover:border-primary/20 hover:shadow-md",
            )}
            style={
              activeSeries === item.slug
                ? { boxShadow: "0 8px 30px -10px oklch(0.60 0.18 25 / 0.4)" }
                : undefined
            }
          >
            {item.coverImage ? (
              <div className="relative h-24 w-full overflow-hidden rounded-lg">
                <Image
                  src={item.coverImage}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-200 group-hover:scale-105"
                />
              </div>
            ) : (
              <div className="flex h-24 w-full items-center justify-center rounded-lg bg-muted">
                <HugeiconsIcon
                  icon={LibraryIcon}
                  size={32}
                  className="text-muted-foreground"
                />
              </div>
            )}

            <div className="flex flex-1 flex-col gap-2">
              <h3 className="line-clamp-1 font-semibold">{item.title}</h3>
              {item.description && (
                <p className="line-clamp-2 text-muted-foreground text-sm">
                  {item.description}
                </p>
              )}
              <span className="text-primary text-sm">
                {item.postCount} {item.postCount === 1 ? "post" : "posts"}
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
