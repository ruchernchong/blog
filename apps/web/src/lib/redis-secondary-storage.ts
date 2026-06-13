import type { SecondaryStorage } from "better-auth";
import redis from "@/config/redis";

const KEY_PREFIX = "better-auth:";

export const redisSecondaryStorage: SecondaryStorage = {
  get: (key) => redis.get<string>(`${KEY_PREFIX}${key}`),
  set: (key, value, ttl) =>
    ttl
      ? redis.set(`${KEY_PREFIX}${key}`, value, { ex: ttl })
      : redis.set(`${KEY_PREFIX}${key}`, value),
  delete: async (key) => {
    await redis.del(`${KEY_PREFIX}${key}`);
  },
};
