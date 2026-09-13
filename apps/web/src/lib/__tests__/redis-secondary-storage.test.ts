import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/config/redis", () => ({
  default: {
    get: vi.fn(),
    getdel: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    eval: vi.fn(),
  },
}));

import redis from "@/config/redis";
import { redisSecondaryStorage } from "../redis-secondary-storage";

describe("redisSecondaryStorage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should prefix keys when reading", async () => {
    await redisSecondaryStorage.get("session");
    await redisSecondaryStorage.getAndDelete?.("session");

    expect(redis.get).toHaveBeenCalledWith("better-auth:session");
    expect(redis.getdel).toHaveBeenCalledWith("better-auth:session");
  });

  it("should set a key with a TTL when given one", async () => {
    await redisSecondaryStorage.set("session", "value", 60);

    expect(redis.set).toHaveBeenCalledWith("better-auth:session", "value", {
      ex: 60,
    });
  });

  it("should set a key without a TTL", async () => {
    await redisSecondaryStorage.set("session", "value");

    expect(redis.set).toHaveBeenCalledWith("better-auth:session", "value");
  });

  it("should delete a prefixed key", async () => {
    await redisSecondaryStorage.delete("session");

    expect(redis.del).toHaveBeenCalledWith("better-auth:session");
  });

  it("should return the incremented count as a number", async () => {
    vi.mocked(redis.eval).mockResolvedValueOnce(3).mockResolvedValueOnce("4");

    expect(await redisSecondaryStorage.increment?.("rate", 60)).toBe(3);
    expect(await redisSecondaryStorage.increment?.("rate", 60)).toBe(4);
    expect(redis.eval).toHaveBeenCalledWith(
      expect.any(String),
      ["better-auth:rate"],
      [60],
    );
  });
});
