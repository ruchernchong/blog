import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

vi.mock("@/config/posthog", () => ({
  POSTHOG_API_HOST: "https://posthog.test",
  POSTHOG_API_KEY: "test-key",
  POSTHOG_PRODUCTION_HOST: "ruchern.dev",
  POSTHOG_PROJECT_ID: "123",
  POSTHOG_TIMEZONE: "Asia/Singapore",
  TOP_PAGES_DAYS: 30,
  VISITS_CHART_DAYS: 90,
}));

import { getLastUpdated, getPages, getTotalVisits, getVisits } from "./posthog";

const fetchMock = vi.fn();

const okResponse = (body: unknown) =>
  Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });

describe("posthog queries", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("getLastUpdated", () => {
    it("should return the latest pageview timestamp", async () => {
      fetchMock.mockReturnValue(
        okResponse({ results: [["2026-09-14T10:00:00Z"]] }),
      );

      await expect(getLastUpdated()).resolves.toBe("2026-09-14T10:00:00Z");
      expect(fetchMock).toHaveBeenCalledWith(
        "https://posthog.test/api/projects/123/query",
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("should return null when the API responds with an error status", async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 500 });

      await expect(getLastUpdated()).resolves.toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        "PostHog Query API error: 500",
      );
    });

    it("should return null when there are no results", async () => {
      fetchMock.mockReturnValue(okResponse({ results: [] }));

      await expect(getLastUpdated()).resolves.toBeNull();
    });
  });

  describe("getTotalVisits", () => {
    it("should return the total pageview count", async () => {
      fetchMock.mockReturnValue(okResponse({ results: [[1234]] }));

      await expect(getTotalVisits()).resolves.toBe(1234);
    });

    it("should return 0 when the request throws", async () => {
      fetchMock.mockRejectedValue(new Error("network"));

      await expect(getTotalVisits()).resolves.toBe(0);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("getVisits", () => {
    it("should map rows into date and visit pairs", async () => {
      fetchMock.mockReturnValue(
        okResponse({
          results: [
            ["2026-09-13", 10],
            ["2026-09-14", 20],
          ],
        }),
      );

      await expect(getVisits()).resolves.toEqual([
        { date: "2026-09-13", visits: 10 },
        { date: "2026-09-14", visits: 20 },
      ]);
    });

    it("should return an empty list when the query fails", async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 401 });

      await expect(getVisits()).resolves.toEqual([]);
    });
  });

  describe("getPages", () => {
    it("should compute each page's share of total views", async () => {
      fetchMock.mockReturnValue(
        okResponse({
          results: [
            ["/", 2],
            ["/blog", 1],
          ],
        }),
      );

      await expect(getPages()).resolves.toEqual([
        { path: "/", count: 2, percent: 66.7 },
        { path: "/blog", count: 1, percent: 33.3 },
      ]);
    });

    it("should return an empty list when there are no results", async () => {
      fetchMock.mockReturnValue(okResponse({ results: [] }));

      await expect(getPages()).resolves.toEqual([]);
    });

    it("should return an empty list when the query fails", async () => {
      fetchMock.mockRejectedValue(new Error("network"));

      await expect(getPages()).resolves.toEqual([]);
    });
  });
});
