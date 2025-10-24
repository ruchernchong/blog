import type { Redis } from "@upstash/redis";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { ERROR_IDS } from "@/constants/error-ids";
import * as logger from "@/lib/logger";
import { CacheService } from "../cache.service";

vi.mock("@/lib/logger", () => ({
  logError: vi.fn(),
}));

describe("CacheService", () => {
  let mockRedis: {
    get: Mock;
    set: Mock;
    del: Mock;
    zadd: Mock;
    zrange: Mock;
    zrem: Mock;
    ping: Mock;
  };
  let cacheService: CacheService;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRedis = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
      zadd: vi.fn(),
      zrange: vi.fn(),
      zrem: vi.fn(),
      ping: vi.fn(),
    };

    cacheService = new CacheService(mockRedis as unknown as Redis);
  });

  describe("get", () => {
    it("returns cached value when key exists", async () => {
      const testData = { foo: "bar" };
      mockRedis.get.mockResolvedValue(testData);

      const result = await cacheService.get("test-key");

      expect(result).toEqual(testData);
      expect(mockRedis.get).toHaveBeenCalledWith("test-key");
    });

    it("returns null when key does not exist", async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await cacheService.get("nonexistent-key");

      expect(result).toBeNull();
    });

    it("returns null and logs error when Redis fails", async () => {
      const error = new Error("Redis connection failed");
      mockRedis.get.mockRejectedValue(error);

      const result = await cacheService.get("test-key");

      expect(result).toBeNull();
      expect(logger.logError).toHaveBeenCalledWith(
        ERROR_IDS.CACHE_READ_FAILED,
        error,
        { key: "test-key" },
      );
    });
  });

  describe("set", () => {
    it("sets value without expiration", async () => {
      mockRedis.set.mockResolvedValue("OK");

      await cacheService.set("test-key", { foo: "bar" });

      expect(mockRedis.set).toHaveBeenCalledWith("test-key", { foo: "bar" });
    });

    it("sets value with expiration", async () => {
      mockRedis.set.mockResolvedValue("OK");
      const data = { foo: "bar" };
      const options = { ex: 3600 };

      await cacheService.set("test-key", data, options);

      expect(mockRedis.set).toHaveBeenCalledWith("test-key", data, options);
    });

    it("logs error when Redis fails but does not throw", async () => {
      const error = new Error("Redis write failed");
      mockRedis.set.mockRejectedValue(error);

      await expect(
        cacheService.set("test-key", { foo: "bar" }),
      ).resolves.toBeUndefined();

      expect(logger.logError).toHaveBeenCalledWith(
        ERROR_IDS.CACHE_WRITE_FAILED,
        error,
        { key: "test-key" },
      );
    });
  });

  describe("del", () => {
    it("deletes single key", async () => {
      mockRedis.del.mockResolvedValue(1);

      await cacheService.del("test-key");

      expect(mockRedis.del).toHaveBeenCalledWith("test-key");
    });

    it("deletes multiple keys", async () => {
      mockRedis.del.mockResolvedValue(2);
      const keys = ["key1", "key2"];

      await cacheService.del(keys);

      expect(mockRedis.del).toHaveBeenCalledWith(...keys);
    });

    it("logs error when Redis fails", async () => {
      const error = new Error("Redis delete failed");
      mockRedis.del.mockRejectedValue(error);

      await cacheService.del("test-key");

      expect(logger.logError).toHaveBeenCalledWith(
        ERROR_IDS.CACHE_DELETE_FAILED,
        error,
        { keys: ["test-key"] },
      );
    });
  });

  describe("zadd", () => {
    it("adds member to sorted set", async () => {
      mockRedis.zadd.mockResolvedValue(1);

      await cacheService.zadd("popular-posts", 100, "post-slug");

      expect(mockRedis.zadd).toHaveBeenCalledWith("popular-posts", {
        score: 100,
        member: "post-slug",
      });
    });

    it("logs error when Redis fails", async () => {
      const error = new Error("Redis zadd failed");
      mockRedis.zadd.mockRejectedValue(error);

      await cacheService.zadd("popular-posts", 100, "post-slug");

      expect(logger.logError).toHaveBeenCalledWith(
        ERROR_IDS.CACHE_WRITE_FAILED,
        error,
        { key: "popular-posts", score: 100, member: "post-slug" },
      );
    });
  });

  describe("zrange", () => {
    it("returns range from sorted set", async () => {
      const mockData = ["post-1", 10, "post-2", 20];
      mockRedis.zrange.mockResolvedValue(mockData);

      const result = await cacheService.zrange("popular-posts", 0, 9, {
        rev: true,
        withScores: true,
      });

      expect(result).toEqual(mockData);
      expect(mockRedis.zrange).toHaveBeenCalledWith("popular-posts", 0, 9, {
        rev: true,
        withScores: true,
      });
    });

    it("returns empty array when Redis fails", async () => {
      const error = new Error("Redis zrange failed");
      mockRedis.zrange.mockRejectedValue(error);

      const result = await cacheService.zrange("popular-posts", 0, 9);

      expect(result).toEqual([]);
      expect(logger.logError).toHaveBeenCalledWith(
        ERROR_IDS.CACHE_READ_FAILED,
        error,
        { key: "popular-posts", start: 0, stop: 9 },
      );
    });

    it("returns empty array when Redis returns null", async () => {
      mockRedis.zrange.mockResolvedValue(null);

      const result = await cacheService.zrange("popular-posts", 0, 9);

      expect(result).toEqual([]);
    });
  });

  describe("zrem", () => {
    it("removes member from sorted set", async () => {
      mockRedis.zrem.mockResolvedValue(1);

      await cacheService.zrem("popular-posts", "post-slug");

      expect(mockRedis.zrem).toHaveBeenCalledWith("popular-posts", "post-slug");
    });

    it("logs error when Redis fails", async () => {
      const error = new Error("Redis zrem failed");
      mockRedis.zrem.mockRejectedValue(error);

      await cacheService.zrem("popular-posts", "post-slug");

      expect(logger.logError).toHaveBeenCalledWith(
        ERROR_IDS.CACHE_DELETE_FAILED,
        error,
        { key: "popular-posts", member: "post-slug" },
      );
    });
  });

  describe("isHealthy", () => {
    it("returns true when Redis is reachable", async () => {
      mockRedis.ping.mockResolvedValue("PONG");

      const result = await cacheService.isHealthy();

      expect(result).toBe(true);
      expect(mockRedis.ping).toHaveBeenCalled();
    });

    it("returns false when Redis is unreachable", async () => {
      const error = new Error("Connection timeout");
      mockRedis.ping.mockRejectedValue(error);

      const result = await cacheService.isHealthy();

      expect(result).toBe(false);
      expect(logger.logError).toHaveBeenCalledWith(
        ERROR_IDS.CACHE_CONNECTION_FAILED,
        error,
      );
    });
  });
});
