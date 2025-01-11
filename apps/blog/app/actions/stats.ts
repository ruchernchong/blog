"use server";

import redis from "@/config/redis";
import type { PostStats } from "@/types";
import { generateUserHash } from "@/lib/hash";
import { headers } from "next/headers";

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

export const getPostStats = async (slug: string): Promise<PostStats> => {
  const key = `post:${slug}`;
  const stats = await redis.get<PostStats>(key);

  if (!stats) {
    const defaultStats: PostStats = {
      slug,
      likesByUser: {},
      views: 0,
    };
    await redis.set(key, defaultStats);
    return defaultStats;
  }

  return stats;
};

export const incrementViews = async (slug: string): Promise<PostStats> => {
  const stats = await getPostStats(slug);
  const updatedStats: PostStats = {
    ...stats,
    views: stats.views + 1,
  };
  await redis.set(`post:${slug}`, updatedStats);
  return updatedStats;
};

export const getLikesByUser = async (slug: string): Promise<number> => {
  const stats = await getPostStats(slug);
  const userHash = generateUserHash(await getIpAddress());
  return stats.likesByUser[userHash] || 0;
};

export const getTotalLikes = async (slug: string): Promise<number> => {
  const stats = await getPostStats(slug);
  return Object.values(stats.likesByUser).reduce(
    (sum, likes) => sum + likes,
    0,
  );
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
