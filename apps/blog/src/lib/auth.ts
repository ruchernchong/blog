import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { lastLoginMethod, oAuthProxy } from "better-auth/plugins";
import { ERROR_IDS } from "@/constants/errorIds";
import { logError } from "@/lib/logger";
import { db } from "@/schema";

/**
 * Validates that a required environment variable is set.
 * Throws an error if the variable is missing or empty.
 *
 * @param key - The environment variable name
 * @returns The validated environment variable value
 * @throws Error if the environment variable is not set
 */
const validateEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    const error = new Error(`Missing required environment variable: ${key}`);
    logError(ERROR_IDS.ENV_VALIDATION_FAILED, error, { key });
    throw error;
  }
  return value;
};

/**
 * Better Auth configuration for the application.
 *
 * Provides OAuth authentication via GitHub and Google with account linking enabled.
 * Sessions are stored in PostgreSQL via Drizzle ORM.
 *
 * @see {@link https://better-auth.com/docs Better Auth Documentation}
 *
 * Environment variables required:
 * - BETTER_AUTH_SECRET: Secret key for session encryption (min 32 characters)
 * - BETTER_AUTH_URL: Base URL for OAuth callbacks
 * - GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET: GitHub OAuth credentials
 * - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET: Google OAuth credentials
 * - DATABASE_URL: PostgreSQL connection string (via db import)
 */
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: ["*.vercel.app"],
  database: drizzleAdapter(db, { provider: "pg" }),
  account: {
    accountLinking: {
      enabled: true,
      // Allows users to link multiple OAuth accounts (GitHub + Google) to a single user account
      // Only trusted providers can be automatically linked; others require manual verification
      trustedProviders: ["github", "google"],
    },
  },
  socialProviders: {
    github: {
      clientId: validateEnv("GITHUB_CLIENT_ID"),
      clientSecret: validateEnv("GITHUB_CLIENT_SECRET"),
      redirectURI: `${process.env.BETTER_AUTH_URL}/api/auth/callback/github`,
    },
    google: {
      clientId: validateEnv("GOOGLE_CLIENT_ID"),
      clientSecret: validateEnv("GOOGLE_CLIENT_SECRET"),
      redirectURI: `${process.env.BETTER_AUTH_URL}/api/auth/callback/google`,
    },
  },
  plugins: [
    lastLoginMethod({
      storeInDatabase: true,
    }),
    oAuthProxy(),
  ],
});
