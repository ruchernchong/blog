import redis from "@/config/redis";
import { CacheConfig } from "@/lib/config/cache.config";
import { getPostsWithOverlappingTags } from "@/lib/queries/posts";
import type { PostToolServices } from "./tools/posts.tools";

export function createWorkerPostToolServices(): PostToolServices {
  return {
    async invalidatePost(slug) {
      await redis.del(
        CacheConfig.REDIS_KEYS.POST_STATS(slug),
        CacheConfig.REDIS_KEYS.RELATED_CACHE(slug),
      );
    },
    async invalidatePopularPost(slug) {
      await Promise.all([
        redis.zrem(CacheConfig.REDIS_KEYS.POPULAR_SET, slug),
        redis.del(
          CacheConfig.REDIS_KEYS.POST_STATS(slug),
          CacheConfig.REDIS_KEYS.RELATED_CACHE(slug),
        ),
      ]);
    },
    async invalidateRelatedByTags(tags, excludeSlug) {
      if (!tags.length) {
        return;
      }

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
    },
  };
}
