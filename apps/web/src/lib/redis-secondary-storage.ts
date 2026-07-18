import type { SecondaryStorage } from "better-auth";
import redis from "@/config/redis";

const KEY_PREFIX = "better-auth:";

export const redisSecondaryStorage: SecondaryStorage = {
  get: (key) => redis.get<string>(`${KEY_PREFIX}${key}`),
  set: (key, value, ttl) =>
    ttl
      ? redis.set(`${KEY_PREFIX}${key}`, value, { ex: ttl })
      : redis.set(`${KEY_PREFIX}${key}`, value),
  // Better Auth 1.7 requires an atomic get-and-delete; Upstash GETDEL provides it.
  getAndDelete: (key) => redis.getdel<string>(`${KEY_PREFIX}${key}`),
  // Better Auth 1.7 requires an atomic increment for secondary-storage rate
  // limiting. INCR returns the post-increment value; apply the TTL only on
  // creation (when the counter first reaches 1) so the window is fixed.
  increment: async (key, ttl) => {
    const value = await redis.incr(`${KEY_PREFIX}${key}`);
    if (value === 1) {
      await redis.expire(`${KEY_PREFIX}${key}`, ttl);
    }
    return value;
  },
  delete: async (key) => {
    await redis.del(`${KEY_PREFIX}${key}`);
  },
};
