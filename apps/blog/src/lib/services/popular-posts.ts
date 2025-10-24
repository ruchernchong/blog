import { cache } from "react";
import redis from "@/config/redis";
import { getPublishedPostsBySlugs } from "@/lib/queries/posts";

export const getPopularPosts = cache(async (limit: number = 5) => {
  // Get top N from sorted set (highest scores first)
  const results = await redis.zrange("posts:popular", 0, limit - 1, {
    rev: true,
    withScores: true,
  });

  if (!results || results.length === 0) return [];

  // Parse results - zrange with withScores returns alternating member/score values
  const parsedResults: Array<{ member: string; score: number }> = [];
  for (let i = 0; i < results.length; i += 2) {
    parsedResults.push({
      member: results[i] as string,
      score: Number(results[i + 1]),
    });
  }

  const slugs = parsedResults.map((r) => r.member);

  // Fetch full post data from DB
  const popularPosts = await getPublishedPostsBySlugs(slugs);

  // Merge with view counts and sort
  return popularPosts
    .map((post) => ({
      ...post,
      views: parsedResults.find((r) => r.member === post.slug)?.score || 0,
    }))
    .sort((a, b) => b.views - a.views);
});
