import type { ErrorId } from "@/constants/errorIds";

/**
 * Log levels for different types of messages
 */
export enum LogLevel {
  ERROR = "error",
  WARN = "warn",
  INFO = "info",
  DEBUG = "debug",
}

/**
 * Context object for providing additional metadata with log messages
 */
export type LogContext = Record<string, unknown>;

/**
 * Logs an error with a specific error ID for tracking in Sentry.
 *
 * @param errorId - Unique identifier for the error type (from ERROR_IDS)
 * @param error - The error object or message to log
 * @param context - Additional context about the error (user ID, request data, etc.)
 *
 * @example
 * logError(ERROR_IDS.POST_CREATE_FAILED, error, {
 *   title: "My Post",
 *   slug: "my-post",
 *   userId: "123"
 * });
 */
export const logError = (
  errorId: ErrorId,
  error: unknown,
  context?: LogContext,
): void => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  // Log to console with error ID
  console.error(`[${errorId}]`, {
    errorId,
    message: errorMessage,
    stack: errorStack,
    context,
    timestamp: new Date().toISOString(),
  });

  // TODO: Send to Sentry when configured
  // Sentry.captureException(error, {
  //   tags: { errorId },
  //   extra: context,
  // });
};

/**
 * Logs a warning message for debugging purposes.
 *
 * @param message - The warning message
 * @param context - Additional context
 *
 * @example
 * logWarning("Deprecated API endpoint used", { endpoint: "/old-api" });
 */
export const logWarning = (message: string, context?: LogContext): void => {
  console.warn(`[WARNING]`, {
    message,
    context,
    timestamp: new Date().toISOString(),
  });

  // TODO: Send to Sentry as warning level
};

/**
 * Logs an informational message for debugging.
 *
 * @param message - The info message
 * @param context - Additional context
 *
 * @example
 * logInfo("User published post", { postId: "123", userId: "456" });
 */
export const logInfo = (message: string, context?: LogContext): void => {
  if (process.env.NODE_ENV === "development") {
    console.info(`[INFO]`, {
      message,
      context,
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Logs a debug message (only in development).
 *
 * @param message - The debug message
 * @param context - Additional context
 *
 * @example
 * logDebug("Cache hit for user profile", { userId: "123" });
 */
export const logDebug = (message: string, context?: LogContext): void => {
  if (process.env.NODE_ENV === "development") {
    console.debug(`[DEBUG]`, {
      message,
      context,
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Logs an event for analytics purposes.
 *
 * @param eventName - The name of the event
 * @param properties - Event properties
 *
 * @example
 * logEvent("post_created", { category: "tutorial", status: "published" });
 */
export const logEvent = (eventName: string, properties?: LogContext): void => {
  if (process.env.NODE_ENV === "development") {
    console.log(`[EVENT: ${eventName}]`, properties);
  }

  // TODO: Send to analytics service
  // analytics.track(eventName, properties);
};
