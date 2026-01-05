import { getUniqueTags } from "@/lib/tags";
import { TagSelector } from "./tag-selector";

interface TagFilterProps {
  className?: string;
}

export async function TagFilter({ className }: TagFilterProps) {
  const tags = await getUniqueTags();

  if (tags.length === 0) {
    return null;
  }

  return <TagSelector tags={tags} className={className} />;
}
