import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { revalidateTags } from "./revalidate-tags";

const fetchMock = vi.fn();

describe("revalidateTags", () => {
  beforeEach(() => {
    fetchMock
      .mockReset()
      .mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("REVALIDATE_URL", "https://example.test/api/revalidate");
    vi.stubEnv("REVALIDATE_SECRET", "secret");
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("should POST the tags with the bearer secret", async () => {
    await revalidateTags(["posts:list", "post:hello"]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://example.test/api/revalidate");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer secret");
    expect(JSON.parse(init.body)).toEqual({
      tags: ["posts:list", "post:hello"],
    });
  });

  it("should send tags in batches of 100", async () => {
    const tags = Array.from({ length: 250 }, (_, index) => `tag-${index}`);

    await revalidateTags(tags);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    const sizes = fetchMock.mock.calls.map(
      ([, init]) => JSON.parse(init.body).tags.length,
    );
    expect(sizes).toEqual([100, 100, 50]);
  });

  it("should skip the request when the env is not set", async () => {
    vi.stubEnv("REVALIDATE_SECRET", "");

    await revalidateTags(["posts:list"]);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalled();
  });

  it("should only warn when the route responds with an error", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 401 }));

    await expect(revalidateTags(["posts:list"])).resolves.toBeUndefined();
    expect(console.warn).toHaveBeenCalledWith(
      "Revalidation failed with status 401",
    );
  });

  it("should only warn when the request throws", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));

    await expect(revalidateTags(["posts:list"])).resolves.toBeUndefined();
    expect(console.warn).toHaveBeenCalledWith(
      "Revalidation request failed",
      expect.any(Error),
    );
  });
});
