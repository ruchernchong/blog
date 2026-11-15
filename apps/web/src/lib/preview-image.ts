import { cacheLife } from "next/cache";
import { logWarning } from "@/lib/logger";

// In order of preference: Open Graph first, then the Twitter card.
const IMAGE_KEYS = [
  "og:image",
  "og:image:secure_url",
  "og:image:url",
  "twitter:image",
  "twitter:image:src",
];

const META_TAG = /<meta\b[^>]*>/gi;
const ATTRIBUTE = /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
const FETCH_TIMEOUT_MS = 5000;

export const extractPreviewImage = (
  html: string,
  pageUrl: string,
): string | null => {
  const found = new Map<string, string>();

  for (const [tag] of html.matchAll(META_TAG)) {
    const attributes: Record<string, string> = {};
    for (const [, name, double, single] of tag.matchAll(ATTRIBUTE)) {
      attributes[name.toLowerCase()] = double ?? single;
    }

    const key = (attributes.property ?? attributes.name)?.toLowerCase();
    if (key && attributes.content && !found.has(key)) {
      found.set(key, attributes.content);
    }
  }

  const content = IMAGE_KEYS.map((key) => found.get(key)).find(Boolean);
  if (!content) {
    return null;
  }

  try {
    const url = new URL(content.replaceAll("&amp;", "&"), pageUrl);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
};

/**
 * Resolves the Open Graph (or Twitter card) image a page advertises.
 * Returns null when the page is unreachable or advertises none, so callers
 * can fall back to a placeholder.
 */
export const getPreviewImage = async (
  pageUrl: string,
): Promise<string | null> => {
  "use cache";
  cacheLife("hours");

  try {
    const response = await fetch(pageUrl, {
      headers: { accept: "text/html" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      logWarning("Preview image page returned an error", {
        pageUrl,
        status: response.status,
      });
      return null;
    }

    return extractPreviewImage(await response.text(), response.url || pageUrl);
  } catch (error) {
    logWarning("Preview image fetch failed", {
      pageUrl,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
};
