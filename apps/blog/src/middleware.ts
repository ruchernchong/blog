import { betterFetch } from "@better-fetch/fetch";
import type { Session } from "better-auth/types";
import { type NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { ERROR_IDS } from "@/constants/errorIds";

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
export const middleware = async (request: NextRequest) => {
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
      logError(ERROR_IDS.AUTH_SESSION_FAILED, error, {
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

    // Session valid, allow access
    return NextResponse.next();
  } catch (error) {
    // Unexpected error (network failure, timeout, etc.)
    logError(ERROR_IDS.AUTH_MIDDLEWARE_ERROR, error, {
      path: request.nextUrl.pathname,
    });
    // Fail closed: redirect to login on any unexpected error
    return NextResponse.redirect(new URL("/login", request.url));
  }
};

export const config = {
  matcher: ["/studio/:path*"],
};
