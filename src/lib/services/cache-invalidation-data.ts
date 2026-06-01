import redis from "@/config/redis";
import { CacheConfig } from "@/lib/config/cache.config";
import { getPostsWithOverlappingTags } from "@/lib/queries/post-tags";

export async function invalidatePostData(slug: string): Promise<void> {
  const keysToDelete = [
    CacheConfig.REDIS_KEYS.POST_STATS(slug),
    CacheConfig.REDIS_KEYS.RELATED_CACHE(slug),
  ];

  await redis.del(...keysToDelete);
}

export async function invalidateRelatedDataByTags(
  tags: string[],
  excludeSlug?: string,
): Promise<void> {
  if (!tags.length) return;

  const postsWithTags = await getPostsWithOverlappingTags(
    tags,
    excludeSlug || "",
  );

  const keysToDelete = postsWithTags.map((post) =>
    CacheConfig.REDIS_KEYS.RELATED_CACHE(post.slug),
  );

  if (keysToDelete.length > 0) {
    await redis.del(...keysToDelete);
  }
}

export async function invalidatePopularPostData(slug: string): Promise<void> {
  await Promise.all([
    redis.zrem(CacheConfig.REDIS_KEYS.POPULAR_SET, slug),
    invalidatePostData(slug),
  ]);
}
