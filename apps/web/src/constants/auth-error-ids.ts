/**
 * Authentication and OAuth error IDs, co-located with the auth feature.
 *
 * Kept separate from the general {@link ./error-ids} registry so the auth
 * surface owns its own tracking identifiers. Used with the logger utility to
 * ensure consistent error tracking in Sentry.
 */
export const AUTH_ERROR = {
  AUTH_SESSION_FAILED: "AUTH_SESSION_FAILED",
  AUTH_MIDDLEWARE_ERROR: "AUTH_MIDDLEWARE_ERROR",
  AUTH_POST_FAILED: "AUTH_POST_FAILED",
  AUTH_GET_FAILED: "AUTH_GET_FAILED",
  OAUTH_GOOGLE_FAILED: "OAUTH_GOOGLE_FAILED",
  OAUTH_CONSENT_FAILED: "OAUTH_CONSENT_FAILED",
  OAUTH_TOKEN_VALIDATION_FAILED: "OAUTH_TOKEN_VALIDATION_FAILED",
} as const;

export type AuthErrorId = (typeof AUTH_ERROR)[keyof typeof AUTH_ERROR];
