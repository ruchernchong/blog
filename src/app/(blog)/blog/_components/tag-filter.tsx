"use client";

import { parseAsString, useQueryState } from "nuqs";
import { cn } from "@/lib/utils";

interface TagFilterProps {
  tags: string[];
  className?: string;
}

export const TagFilter = ({ tags, className }: TagFilterProps) => {
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

  if (tags.length === 0) return null;

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
          "shrink-0 rounded-full px-4 py-1.5 font-medium text-sm transition-all duration-200",
          activeTag === null
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:bg-muted/80",
        )}
      >
        All
      </button>
      {tags.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => handleTagClick(tag)}
          className={cn(
            "shrink-0 rounded-full px-4 py-1.5 font-medium text-sm transition-all duration-200",
            activeTag === tag
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80",
          )}
        >
          {tag}
        </button>
      ))}
    </div>
  );
};
