import { NextResponse } from "next/server";
import type { ErrorId } from "@/constants/error-ids";
import { logError, type LogContext } from "@/lib/logger";

/**
 * Standard API error response messages.
 */
export const API_ERROR_MESSAGES = {
  DATABASE_CONNECTION: "Database connection error. Please try again later.",
  UNIQUE_CONSTRAINT: (resource: string, field: string) =>
    `A ${resource} with this ${field} already exists.`,
  NOT_FOUND: (resource: string) => `${resource} not found`,
  INTERNAL_ERROR: (action: string) => `Failed to ${action}`,
} as const;

/**
 * Creates a 503 database error response.
 */
export function databaseErrorResponse(): NextResponse {
  return NextResponse.json(
    { message: API_ERROR_MESSAGES.DATABASE_CONNECTION },
    { status: 503 },
  );
}

/**
 * Creates a 404 not found response.
 *
 * @param resource - Resource type (e.g., "Media", "Post")
 */
export function notFoundResponse(resource: string): NextResponse {
  return NextResponse.json(
    { message: API_ERROR_MESSAGES.NOT_FOUND(resource) },
    { status: 404 },
  );
}

/**
 * Creates a 409 conflict response for unique constraint violations.
 *
 * @param resource - Resource type (e.g., "media item", "post")
 * @param field - Field that caused the conflict (e.g., "key", "slug")
 */
export function conflictResponse(resource: string, field: string): NextResponse {
  return NextResponse.json(
    { message: API_ERROR_MESSAGES.UNIQUE_CONSTRAINT(resource, field) },
    { status: 409 },
  );
}

/**
 * Creates a 500 internal server error response.
 *
 * @param action - Action that failed (e.g., "fetch media", "update post")
 */
export function internalErrorResponse(action: string): NextResponse {
  return NextResponse.json(
    { message: API_ERROR_MESSAGES.INTERNAL_ERROR(action) },
    { status: 500 },
  );
}

/**
 * Checks if an error is a database connection error.
 */
export function isDatabaseError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("database");
}

/**
 * Checks if an error is a unique constraint violation.
 */
export function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("unique constraint");
}

/**
 * Handles common API errors with appropriate responses.
 * Logs the error and returns the appropriate HTTP response.
 *
 * @param error - The caught error
 * @param errorId - Error ID for logging
 * @param action - Action that failed (for error message)
 * @param context - Additional logging context
 * @returns NextResponse with appropriate status code
 *
 * @example
 * ```typescript
 * } catch (error) {
 *   return handleApiError(error, ERROR_IDS.MEDIA_FETCH_FAILED, "fetch media", { mediaId });
 * }
 * ```
 */
export function handleApiError(
  error: unknown,
  errorId: ErrorId,
  action: string,
  context?: LogContext,
): NextResponse {
  logError(errorId, error, context);

  if (isDatabaseError(error)) {
    return databaseErrorResponse();
  }

  return internalErrorResponse(action);
}
