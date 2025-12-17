import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { ApiResult } from "./types";

/**
 * Session data returned from Better Auth.
 */
interface SessionUser {
  id: string;
  email: string;
  name: string;
  image: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthSession {
  user: SessionUser;
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    token: string;
    createdAt: Date;
    updatedAt: Date;
    ipAddress: string | null;
    userAgent: string | null;
  };
}

/**
 * Validates that the request has an authenticated session.
 *
 * @param action - Description of the action requiring auth (e.g., "upload media", "edit posts")
 * @returns Result with session data on success, or 401 response on failure
 *
 * @example
 * ```typescript
 * const authResult = await requireAuth("upload media");
 * if (!authResult.success) return authResult.response;
 * const { user } = authResult.data;
 * ```
 */
export async function requireAuth(
  action: string,
): Promise<ApiResult<AuthSession>> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return {
      success: false,
      response: NextResponse.json(
        { message: `Unauthorized. Please sign in to ${action}.` },
        { status: 401 },
      ),
    };
  }

  return {
    success: true,
    data: session as AuthSession,
  };
}
