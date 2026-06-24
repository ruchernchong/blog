"use client";

import { type Selection, Tag, TagGroup } from "@heroui/react";
import { parseAsString, useQueryState } from "nuqs";

const ALL_KEY = "__all__";

interface TagSelectorProps {
  tags: string[];
  className?: string;
}

export function TagSelector({ tags, className }: TagSelectorProps) {
  const [activeTag, setActiveTag] = useQueryState(
    "tag",
    parseAsString.withOptions({ shallow: false }),
  );

  const handleSelectionChange = (keys: Selection) => {
    if (keys === "all") return;
    const [first] = keys;
    setActiveTag(!first || first === ALL_KEY ? null : String(first));
  };

  return (
    <TagGroup
      aria-label="Filter posts by tag"
      selectionMode="single"
      selectedKeys={new Set([activeTag ?? ALL_KEY])}
      onSelectionChange={handleSelectionChange}
      className={className}
    >
      <TagGroup.List className="scrollbar-hide flex-nowrap overflow-x-auto">
        <Tag id={ALL_KEY}>All</Tag>
        {tags.map((tag) => (
          <Tag key={tag} id={tag}>
            {tag}
          </Tag>
        ))}
      </TagGroup.List>
    </TagGroup>
  );
}
