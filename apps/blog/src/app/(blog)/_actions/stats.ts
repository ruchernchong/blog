"use server";

import { headers } from "next/headers";
import { postStatsService } from "@/lib/services";
import type { Likes, PostStats } from "@/types";
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
  return postStatsService.incrementViews(slug);
};

export const incrementLikes = async (slug: string): Promise<Likes> => {
  try {
    const userHash = generateUserHash(await getIpAddress());
    return postStatsService.incrementLikes(slug, userHash);
  } catch (error) {
    console.error("Error adding like:", error);
    throw error;
  }
};
