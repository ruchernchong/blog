import type { NextResponse } from "next/server";

/**
 * Result type for API operations that can fail.
 * Provides type-safe handling of success and failure cases.
 *
 * @example
 * ```typescript
 * const result = await requireAuth("upload media");
 * if (!result.success) return result.response;
 * const { user } = result.data;
 * ```
 */
export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; response: NextResponse };
