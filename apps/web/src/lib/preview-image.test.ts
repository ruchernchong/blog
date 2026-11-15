import { afterEach, describe, expect, it, vi } from "vitest";
import { extractPreviewImage, getPreviewImage } from "./preview-image";

vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
}));

const PAGE_URL = "https://example.com/projects/demo";

describe("extractPreviewImage", () => {
  it("should return the Open Graph image", () => {
    const html = `<head><meta property="og:image" content="https://cdn.example.com/og.png"/></head>`;

    expect(extractPreviewImage(html, PAGE_URL)).toBe(
      "https://cdn.example.com/og.png",
    );
  });

  it("should prefer the Open Graph image over the Twitter image", () => {
    const html = `
      <meta name="twitter:image" content="https://example.com/twitter.png">
      <meta property="og:image" content="https://example.com/og.png">
    `;

    expect(extractPreviewImage(html, PAGE_URL)).toBe(
      "https://example.com/og.png",
    );
  });

  it("should fall back to the Twitter image", () => {
    const html = `<meta name="twitter:image" content="https://example.com/twitter.png">`;

    expect(extractPreviewImage(html, PAGE_URL)).toBe(
      "https://example.com/twitter.png",
    );
  });

  it("should read attributes in any order and quote style", () => {
    const html = `<meta content='https://example.com/og.png' property='og:image'>`;

    expect(extractPreviewImage(html, PAGE_URL)).toBe(
      "https://example.com/og.png",
    );
  });

  it("should resolve a relative image against the page URL", () => {
    const html = `<meta property="og:image" content="/opengraph-image?a=1&amp;b=2">`;

    expect(extractPreviewImage(html, PAGE_URL)).toBe(
      "https://example.com/opengraph-image?a=1&b=2",
    );
  });

  it("should skip an unusable image for a later HTTPS one", () => {
    const html = `
      <meta property="og:image" content="http://example.com/og.png">
      <meta name="twitter:image" content="https://example.com/twitter.png">
    `;

    expect(extractPreviewImage(html, PAGE_URL)).toBe(
      "https://example.com/twitter.png",
    );
  });

  it("should return null when the page advertises no image", () => {
    const html = `<meta property="og:title" content="Demo">`;

    expect(extractPreviewImage(html, PAGE_URL)).toBeNull();
  });

  it("should return null for a non-HTTPS image", () => {
    const html = `<meta property="og:image" content="http://example.com/og.png">`;

    expect(extractPreviewImage(html, PAGE_URL)).toBeNull();
  });
});

describe("getPreviewImage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("should return the image advertised by the fetched page", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            `<meta property="og:image" content="https://example.com/og.png">`,
          ),
      ),
    );

    await expect(getPreviewImage(PAGE_URL)).resolves.toBe(
      "https://example.com/og.png",
    );
  });

  it("should return null when the page responds with an error", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("Not Found", { status: 404 })),
    );

    await expect(getPreviewImage(PAGE_URL)).resolves.toBeNull();
  });

  it("should return null when the fetch fails", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("fetch failed");
      }),
    );

    await expect(getPreviewImage(PAGE_URL)).resolves.toBeNull();
  });
});
