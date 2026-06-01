import {
  invalidatePopularPostData,
  invalidatePostData,
  invalidateRelatedDataByTags,
} from "@/lib/services/cache-invalidation-data";
import type { PostToolServices } from "@/mcp/tools/posts.tools";

async function revalidateNextTags(tags: string[]): Promise<void> {
  const secret = process.env.MCP_REVALIDATE_SECRET;
  const endpoint =
    process.env.MCP_REVALIDATE_URL ||
    (process.env.NEXT_PUBLIC_BASE_URL
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/mcp/revalidate`
      : undefined);

  if (!secret || !endpoint) {
    return;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-MCP-Revalidate-Secret": secret,
    },
    body: JSON.stringify({ tags }),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to revalidate Next.js cache tags: ${response.status}`,
    );
  }
}

export function createWorkerPostToolServices(): PostToolServices {
  return {
    async invalidatePost(slug) {
      await invalidatePostData(slug);
      await revalidateNextTags([`post:${slug}`, "posts:list", "posts:count"]);
    },
    async invalidatePopularPost(slug) {
      await invalidatePopularPostData(slug);
      await revalidateNextTags([`post:${slug}`, "posts:list", "posts:count"]);
    },
    async invalidateRelatedByTags(tags, excludeSlug) {
      await invalidateRelatedDataByTags(tags, excludeSlug);
    },
  };
}
