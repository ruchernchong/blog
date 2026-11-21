import { AgentAnalytics } from "@upstash/agent-analytics";
import { getSessionCookie } from "better-auth/cookies";
import {
  type NextFetchEvent,
  type NextRequest,
  NextResponse,
} from "next/server";
import redis from "@/config/redis";

const agentAnalytics = new AgentAnalytics({ redis });

/**
 * Next.js Proxy, invoked only for the requests the matcher below selects:
 *
 * - `/studio/*`: optimistically redirects visitors without a Better Auth
 *   session cookie to /login. This is only a fast presence check: the
 *   authoritative session + admin-role validation runs server-side in the
 *   Studio layout ({@link ./app/studio/layout}). Reading the cookie directly
 *   (rather than fetching `/api/auth/get-session`) avoids a cross-origin self
 *   fetch, which fails under local HTTPS dev proxies.
 * - AI agent traffic: requests whose `user-agent` or `referer` names an AI
 *   provider are counted with Upstash Agent Analytics.
 *
 * Every other request skips the Proxy, so prerendered pages are served from
 * the CDN without a function invocation (Active CPU). PostHog needs no Proxy:
 * the `/ingest` rewrites live in `next.config.ts`, and the client SDK sets its
 * own identity cookie.
 *
 * @see {@link https://www.better-auth.com/docs/integrations/next Better Auth Next.js}
 */
export const proxy = (request: NextRequest, event: NextFetchEvent) => {
  if (!request.nextUrl.pathname.startsWith("/studio")) {
    event.waitUntil(agentAnalytics.track(request));
    return NextResponse.next();
  }

  if (!getSessionCookie(request)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
};

export const config = {
  // Matcher values must be literals: Next analyses them at build time and
  // ignores variables. `has` values are anchored, flag-less regexes, so the
  // agent pattern spells out the casings of the substrings that
  // `@upstash/agent-analytics` looks for (chatgpt, openai, claude, anthropic,
  // perplexity, gemini, google-extended, copilot, bing). Separate entries for
  // `user-agent` and `referer` make the two conditions an OR.
  //
  // `.well-known/workflow/` must stay excluded: the Workflow runtime resumes
  // suspended runs by POSTing to its own internal routes, and intercepting them
  // here breaks execution.
  matcher: [
    "/studio/:path*",
    {
      source:
        "/((?!_next/static|_next/image|favicon.ico|ingest/|.well-known/workflow/).*)",
      has: [
        {
          type: "header",
          key: "user-agent",
          value:
            ".*([Cc]hat[Gg][Pp][Tt]|[Oo]pen[Aa][Ii]|[Cc]laude|CLAUDE|[Aa]nthropic|[Pp]erplexity|[Gg]emini|[Gg]oogle-[Ee]xtended|[Cc]opilot|[Bb]ing).*",
        },
      ],
    },
    {
      source:
        "/((?!_next/static|_next/image|favicon.ico|ingest/|.well-known/workflow/).*)",
      has: [
        {
          type: "header",
          key: "referer",
          value:
            ".*(chatgpt|openai|claude|anthropic|perplexity|gemini|copilot|bing).*",
        },
      ],
    },
  ],
};
