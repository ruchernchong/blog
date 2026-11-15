import { postHogMiddleware } from "@posthog/next";
import { AgentAnalytics } from "@upstash/agent-analytics";
import { getSessionCookie } from "better-auth/cookies";
import {
  type NextFetchEvent,
  type NextRequest,
  NextResponse,
} from "next/server";
import redis from "@/config/redis";

const agentAnalytics = new AgentAnalytics({ redis });

const HOMEPAGE_VARY =
  "Accept, rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch";

function withPostHog(request: NextRequest) {
  return postHogMiddleware({
    apiKey: process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN,
    proxy: { host: process.env.NEXT_PUBLIC_POSTHOG_HOST },
  })(request);
}

/**
 * Next.js middleware for protecting the Content Studio routes.
 *
 * Intercepts all requests to /studio/* paths and optimistically redirects
 * visitors without a Better Auth session cookie to /login. This is only a fast
 * presence check: the authoritative session + admin-role validation runs
 * server-side in the Studio layout ({@link ./app/studio/layout}).
 *
 * Reading the cookie directly (rather than fetching `/api/auth/get-session`)
 * avoids a cross-origin self fetch, which fails under local HTTPS dev proxies
 * whose certificate the Edge runtime does not trust.
 *
 * @see {@link https://www.better-auth.com/docs/integrations/next Better Auth Next.js}
 */
export const proxy = async (request: NextRequest, event: NextFetchEvent) => {
  // Public routes skip the auth check and only seed the PostHog identity cookie.
  if (!request.nextUrl.pathname.startsWith("/studio")) {
    event.waitUntil(agentAnalytics.track(request));

    const response = await withPostHog(request);
    // The homepage is HTML or Markdown depending on `Accept` (next.config.ts),
    // so caches must key on it. Next.js sets `Vary` itself on pages and drops
    // one from `headers()`, hence the full list here.
    if (request.nextUrl.pathname === "/") {
      response.headers.set("Vary", HOMEPAGE_VARY);
    }
    return response;
  }

  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Cookie present, allow access and seed the PostHog identity cookie.
  return withPostHog(request);
};

export const config = {
  // `.well-known/workflow/` must stay excluded: the Workflow runtime resumes
  // suspended runs by POSTing to its own internal routes, and intercepting them
  // here breaks execution (the docs call this out specifically for Next.js 16,
  // where `proxy.ts` replaced `middleware.ts`).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.well-known/workflow/).*)",
    "/studio/:path*",
  ],
};
