import { betterFetch } from "@better-fetch/fetch";
import { postHogMiddleware } from "@posthog/next";
import { AgentAnalytics } from "@upstash/agent-analytics";
import type { Session } from "better-auth/types";
import {
  type NextFetchEvent,
  type NextRequest,
  NextResponse,
} from "next/server";
import redis from "@/config/redis";
import { AUTH_ERROR } from "@/constants/auth-error-ids";
import { logError } from "@/lib/logger";

const agentAnalytics = new AgentAnalytics({ redis });

/**
 * Next.js middleware for protecting the Content Studio routes.
 *
 * Intercepts all requests to /studio/* paths and verifies the user has an active
 * Better Auth session. Unauthenticated users are redirected to /login.
 *
 * Uses betterFetch to check session status by calling the Better Auth API endpoint
 * with the request's cookies. This approach works for both client and server routes.
 *
 * @see {@link https://better-auth.com/docs/concepts/session Better Auth Sessions}
 */
export const proxy = async (request: NextRequest, event: NextFetchEvent) => {
  // Public routes skip the auth check and only seed the PostHog identity cookie.
  if (!request.nextUrl.pathname.startsWith("/studio")) {
    event.waitUntil(agentAnalytics.track(request));

    return postHogMiddleware({
      apiKey: process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN,
      proxy: { host: process.env.NEXT_PUBLIC_POSTHOG_HOST },
    })(request);
  }

  try {
    const { data: session, error } = await betterFetch<Session>(
      "/api/auth/get-session",
      {
        baseURL: request.nextUrl.origin,
        headers: {
          cookie: request.headers.get("cookie") || "",
        },
      },
    );

    // Explicit error from betterFetch (network, server error, etc.)
    if (error) {
      logError(AUTH_ERROR.AUTH_SESSION_FAILED, error, {
        path: request.nextUrl.pathname,
        origin: request.nextUrl.origin,
      });
      // Redirect to login instead of showing raw error page
      // This prevents exposing internal error details to potential attackers
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // No session means user is not authenticated
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Session valid, allow access and seed the PostHog identity cookie
    return postHogMiddleware({
      apiKey: process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN,
      proxy: { host: process.env.NEXT_PUBLIC_POSTHOG_HOST },
    })(request);
  } catch (error) {
    // Unexpected error (network failure, timeout, etc.)
    logError(AUTH_ERROR.AUTH_MIDDLEWARE_ERROR, error, {
      path: request.nextUrl.pathname,
    });
    // Fail closed: redirect to login on any unexpected error
    return NextResponse.redirect(new URL("/login", request.url));
  }
};

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)", "/studio/:path*"],
};
