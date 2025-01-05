"use server";

import redis from "@/config/redis";
import { generateUserHash } from "@/lib/hash";
import { headers } from "next/headers";

type PostLikes = {
  slug: string;
  likesByUser: Record<string, number>;
};

const getIpAddress = async (): Promise<string> => {
  const headersList = headers();
  const forwardedFor = (await headersList).get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0];
  }
  const realIp = (await headersList).get("x-real-ip");
  return realIp ?? "127.0.0.1";
};

export const getLikesByUser = async (slug: string) => {
  const key = `post:${slug}`;
  const data = await redis.get<PostLikes>(key);

  let totalLikesByUser = 0;
  if (data) {
    const userHash = generateUserHash(await getIpAddress());
    totalLikesByUser = data?.likesByUser[userHash];
  }
  return totalLikesByUser;
};

export const getTotalLikes = async (slug: string) => {
  const key = `post:${slug}`;
  const data = await redis.get<PostLikes>(key);

  if (!data) {
    return 0;
  }

  return Object.values(data.likesByUser).reduce((sum, likes) => sum + likes, 0);
};

export const addLike = async (slug: string) => {
  try {
    const userHash = generateUserHash(await getIpAddress());
    const key = `post:${slug}`;

    const data = (await redis.get<PostLikes>(key)) ?? {
      slug,
      likesByUser: {},
    };

    const userLikes = data.likesByUser[userHash] ?? 0;
    data.likesByUser[userHash] = userLikes + 1;

    await redis.set(key, data);

    return {
      totalLikes: await getTotalLikes(slug),
      totalLikesByUser: data.likesByUser[userHash],
    };
  } catch (error) {
    console.error("Error adding like:", error);
    throw error;
  }
};
