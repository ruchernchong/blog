import { revalidateTag } from "next/cache";
import {
  invalidatePopularPostCache,
  invalidatePostCache,
  invalidateRelatedCacheByTags,
} from "@/lib/services/post-cache";

// Invalidate Next.js Cache Components
function revalidateTags(tags: string[]): void {
  for (const tag of tags) {
    revalidateTag(tag, "max");
  }
}

export async function invalidatePost(slug: string): Promise<void> {
  await invalidatePostCache(slug, revalidateTags);
}

/**
 * Invalidate related post caches for all posts with overlapping tags
 *
 * @param tags - Tags to find overlapping posts for
 * @param excludeSlug - Optional slug to exclude from invalidation
 */
export async function invalidateRelatedByTags(
  tags: string[],
  excludeSlug?: string,
): Promise<void> {
  await invalidateRelatedCacheByTags(tags, excludeSlug, revalidateTags);
}

/**
 * Remove post from popular sorted set and invalidate its caches
 *
 * @param slug - Post slug to remove
 */
export async function invalidatePopularPost(slug: string): Promise<void> {
  await invalidatePopularPostCache(slug, revalidateTags);
}
