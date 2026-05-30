"use client";

import { cn } from "@heroui/react";
import { parseAsString, useQueryState } from "nuqs";

interface TagSelectorProps {
  tags: string[];
  className?: string;
}

export function TagSelector({ tags, className }: TagSelectorProps) {
  const [activeTag, setActiveTag] = useQueryState(
    "tag",
    parseAsString.withOptions({ shallow: false }),
  );

  const handleTagClick = (tag: string | null) => {
    if (tag === activeTag) {
      setActiveTag(null);
    } else {
      setActiveTag(tag);
    }
  };

  return (
    <div
      className={cn(
        "scrollbar-hide flex gap-2 overflow-x-auto pb-2",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => handleTagClick(null)}
        className={cn(
          "shrink-0 rounded-full px-4 py-2 font-medium text-sm transition-all duration-200 hover:-translate-y-0.5",
          activeTag === null
            ? "bg-accent text-accent-foreground"
            : "bg-default text-muted hover:bg-default/80",
        )}
      >
        All
      </button>
      {tags.map((tag) => {
        return (
          <button
            key={tag}
            type="button"
            onClick={() => handleTagClick(tag)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 font-medium text-sm transition-all duration-200 hover:-translate-y-0.5",
              activeTag === tag
                ? "bg-accent text-accent-foreground"
                : "bg-default text-muted hover:bg-default/80",
            )}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}
