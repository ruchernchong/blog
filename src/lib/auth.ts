import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { betterAuth } from "better-auth/minimal";
import { nextCookies } from "better-auth/next-js";
import { admin, lastLoginMethod, oAuthProxy } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import * as schema from "@/schema";
import { db } from "@/schema";

/**
 * Better Auth configuration for the application.
 *
 * Provides OAuth authentication via Google with account linking enabled.
 * Sessions are stored in PostgreSQL via Drizzle ORM.
 *
 * @see {@link https://better-auth.com/docs Better Auth Documentation}
 *
 * Environment variables required:
 * - BETTER_AUTH_SECRET: Secret key for session encryption (min 32 characters)
 * - BETTER_AUTH_URL: Base URL for OAuth callbacks (optional, auto-detected)
 * - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET: Google OAuth credentials
 * - DATABASE_URL: PostgreSQL connection string (via db import)
 */
export const auth = betterAuth({
  trustedOrigins: ["https://*.vercel.app"],
  database: drizzleAdapter(db, { provider: "pg" }),
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      disableSignUp: true,
    },
  },
  plugins: [
    admin(),
    lastLoginMethod({
      storeInDatabase: true,
    }),
    oAuthProxy({
      productionURL: `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,
    }),
    nextCookies(), // Must be the last plugin
  ],
});
