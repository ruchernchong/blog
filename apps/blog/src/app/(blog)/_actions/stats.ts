"use server";

import { headers } from "next/headers";
import redis from "@/config/redis";
import { getPostStats } from "@/lib/services/post-stats";
import type { PostStats } from "@/types";
import { generateUserHash } from "@/utils/hash";

const DEFAULT_IP = "127.0.0.1";

const getIpAddress = async (): Promise<string> => {
  const headersList = headers();
  const forwardedFor = (await headersList).get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0];
  }
  const realIp = (await headersList).get("x-real-ip");
  return realIp ?? DEFAULT_IP;
};

export const incrementViews = async (slug: string): Promise<PostStats> => {
  const stats = await getPostStats(slug);
  const updatedStats: PostStats = {
    ...stats,
    views: stats.views + 1,
  };

  // Update both hash and sorted set atomically
  await Promise.all([
    redis.set(`post:${slug}`, updatedStats),
    redis.zadd("posts:popular", { score: updatedStats.views, member: slug }),
  ]);

  return updatedStats;
};

export const incrementLikes = async (slug: string) => {
  try {
    const userHash = generateUserHash(await getIpAddress());
    const stats = await getPostStats(slug);
    const userLikes = stats.likesByUser[userHash] ?? 0;

    const updatedStats: PostStats = {
      ...stats,
      likesByUser: {
        ...stats.likesByUser,
        [userHash]: userLikes + 1,
      },
    };

    await redis.set(`post:${slug}`, updatedStats);

    return {
      totalLikes: Object.values(updatedStats.likesByUser).reduce(
        (sum, likes) => sum + likes,
        0,
      ),
      likesByUser: updatedStats.likesByUser[userHash],
    };
  } catch (error) {
    console.error("Error adding like:", error);
    throw error;
  }
};
