import { revalidateTag } from "next/cache";
import {
  invalidatePopularPostData,
  invalidatePostData,
  invalidateRelatedDataByTags,
} from "@/lib/services/cache-invalidation-data";

export async function invalidatePost(slug: string): Promise<void> {
  await invalidatePostData(slug);

  // Invalidate Next.js Cache Components
  revalidateTag(`post:${slug}`, "max");
  revalidateTag("posts:list", "max");
  revalidateTag("posts:count", "max");
}

/**
 * Invalidate related post caches for all posts with overlapping tags
 *
 * Used when a post's tags are modified - all posts that might have
 * calculated similarity with this post need their caches cleared.
 *
 * @param tags - Tags to find overlapping posts for
 * @param excludeSlug - Optional slug to exclude from invalidation
 */
export async function invalidateRelatedByTags(
  tags: string[],
  excludeSlug?: string,
): Promise<void> {
  await invalidateRelatedDataByTags(tags, excludeSlug);
}

/**
 * Remove post from popular sorted set and invalidate its caches
 *
 * Used when a post is deleted or unpublished.
 *
 * @param slug - Post slug to remove
 */
export async function invalidatePopularPost(slug: string): Promise<void> {
  await invalidatePopularPostData(slug);
  revalidateTag(`post:${slug}`, "max");
  revalidateTag("posts:list", "max");
  revalidateTag("posts:count", "max");
}
