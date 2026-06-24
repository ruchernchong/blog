import type { Route } from "next";

/** True when the URL points at github.com (or a subdomain). */
export function isGitHubUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === "github.com" || hostname.endsWith(".github.com");
  } catch {
    return false;
  }
}

/** First non-GitHub link in a project's links (its live/demo URL), if any. */
export function liveUrl(links: Route[]): Route | undefined {
  return links.find((link) => !isGitHubUrl(link));
}

/** First GitHub link in a project's links, if any. */
export function repoUrl(links: Route[]): Route | undefined {
  return links.find((link) => isGitHubUrl(link));
}
