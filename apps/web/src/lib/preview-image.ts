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

  for (const key of IMAGE_KEYS) {
    const content = found.get(key);
    if (!content) {
      continue;
    }

    try {
      const url = new URL(content.replaceAll("&amp;", "&"), pageUrl);
      if (url.protocol === "https:") {
        return url.href;
      }
    } catch {
      // Unparseable candidate: try the next one.
    }
  }

  return null;
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
  cacheLife("max");

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
