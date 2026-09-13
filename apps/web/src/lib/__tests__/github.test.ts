import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { query, getByUsername, listForUser, setContextCallbacks } = vi.hoisted(
  () => ({
    query: vi.fn(),
    getByUsername: vi.fn(),
    listForUser: vi.fn(),
    setContextCallbacks: [] as Array<
      (
        operation: unknown,
        context: { headers?: Record<string, string> },
      ) => { headers: Record<string, string> }
    >,
  }),
);

vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

vi.mock("@apollo/client", () => ({
  ApolloClient: class {
    query = query;
  },
  InMemoryCache: class {},
  createHttpLink: vi.fn(() => ({})),
  gql: vi.fn(),
}));

vi.mock("@apollo/client/link/context", () => ({
  setContext: vi.fn((callback: (typeof setContextCallbacks)[number]) => {
    setContextCallbacks.push(callback);
    return { concat: vi.fn(() => ({})) };
  }),
}));

vi.mock("@octokit/rest", () => ({
  Octokit: class {
    rest = {
      users: { getByUsername },
      repos: { listForUser },
    };
  },
}));

import {
  getGitHubContributions,
  getGitHubFollowers,
  getGitHubPinnedRepositories,
  getGitHubStars,
  getGitHubTotalCommits,
} from "../github";

describe("github", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("auth link", () => {
    it("should attach the bearer token while keeping existing headers", () => {
      vi.stubEnv("GH_ACCESS_TOKEN", "secret-token");

      const [callback] = setContextCallbacks;
      const result = callback({}, { headers: { "x-custom": "1" } });

      expect(result.headers).toEqual({
        "x-custom": "1",
        authorization: "Bearer secret-token",
      });

      vi.unstubAllEnvs();
    });
  });

  describe("getGitHubPinnedRepositories", () => {
    it("should return the pinned repository nodes", async () => {
      const repo = {
        id: "1",
        name: "blog",
        description: "My blog",
        url: "https://github.com/ruchernchong/blog",
        stargazers: { totalCount: 5 },
      };
      query.mockResolvedValue({
        data: { user: { pinnedItems: { edges: [{ node: repo }] } } },
      });

      await expect(getGitHubPinnedRepositories()).resolves.toEqual([repo]);
    });
  });

  describe("getGitHubContributions", () => {
    it("should return the user profile", async () => {
      const user = {
        contributionsCollection: { totalCommitContributions: 100 },
        pullRequests: { totalCount: 10 },
        followers: { totalCount: 20 },
        url: "https://github.com/ruchernchong",
      };
      query.mockResolvedValue({ data: { user } });

      await expect(getGitHubContributions()).resolves.toEqual(user);
    });
  });

  describe("getGitHubTotalCommits", () => {
    it("should sum one query per year since 2014 up to the current year", async () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date("2016-06-01T00:00:00Z"));

      query.mockResolvedValue({
        data: {
          user: { contributionsCollection: { totalCommitContributions: 5 } },
        },
      });

      // 2014, 2015 and 2016
      await expect(getGitHubTotalCommits()).resolves.toBe(15);
      expect(query).toHaveBeenCalledTimes(3);
    });

    it("should count a failed or empty year as zero", async () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date("2016-06-01T00:00:00Z"));

      query
        .mockRejectedValueOnce(new Error("RESOURCE_LIMITS_EXCEEDED"))
        .mockResolvedValueOnce({ data: { user: null } })
        .mockResolvedValueOnce({
          data: {
            user: { contributionsCollection: { totalCommitContributions: 7 } },
          },
        });

      await expect(getGitHubTotalCommits()).resolves.toBe(7);
    });
  });

  describe("getGitHubFollowers", () => {
    it("should return the follower count", async () => {
      getByUsername.mockResolvedValue({ data: { followers: 42 } });

      await expect(getGitHubFollowers()).resolves.toBe(42);
      expect(getByUsername).toHaveBeenCalledWith({ username: "ruchernchong" });
    });

    it("should return 0 when the request fails", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      getByUsername.mockRejectedValue(new Error("API down"));

      await expect(getGitHubFollowers()).resolves.toBe(0);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("getGitHubStars", () => {
    it("should sum stargazers across repositories", async () => {
      listForUser.mockResolvedValue({
        data: [
          { stargazers_count: 3 },
          { stargazers_count: undefined },
          { stargazers_count: 4 },
        ],
      });

      await expect(getGitHubStars()).resolves.toBe(7);
      expect(listForUser).toHaveBeenCalledWith({
        username: "ruchernchong",
        per_page: 100,
      });
    });

    it("should return 0 when the request fails", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      listForUser.mockRejectedValue(new Error("API down"));

      await expect(getGitHubStars()).resolves.toBe(0);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
