import { cacheLife, cacheTag } from "next/cache";
import { getPublishedPosts } from "@/lib/queries/posts";

/**
 * Get all unique tags from published posts
 *
 * Fetches all published posts and extracts unique tags,
 * sorted alphabetically.
 *
 * @returns Array of unique tag strings, sorted alphabetically
 */
export const getUniqueTags = async (): Promise<string[]> => {
  "use cache";
  cacheLife("max");
  cacheTag("posts");

  const posts = await getPublishedPosts();

  const tagSet = new Set<string>();
  for (const post of posts) {
    for (const tag of post.tags) {
      tagSet.add(tag);
    }
  }

  return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
};

/**
 * Get tag counts from published posts
 *
 * Returns each tag with its occurrence count across all posts.
 *
 * @returns Map of tag to count
 */
export const getTagCounts = async (): Promise<Map<string, number>> => {
  "use cache";
  cacheLife("max");
  cacheTag("posts");

  const posts = await getPublishedPosts();

  const tagCounts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }

  return tagCounts;
};
