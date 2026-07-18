import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { oauthProvider } from "@better-auth/oauth-provider";
import { betterAuth } from "better-auth/minimal";
import { nextCookies } from "better-auth/next-js";
import { admin, jwt, lastLoginMethod, oAuthProxy } from "better-auth/plugins";
import { bearer } from "better-auth/plugins/bearer";
import { redisSecondaryStorage } from "@/lib/redis-secondary-storage";
import { db } from "@/schema";
import * as schema from "@/schema/schema";

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
  secondaryStorage: redisSecondaryStorage,
  baseURL: {
    allowedHosts: [
      "ruchern.dev",
      "*.ruchern.dev",
      "blog-web-*.vercel.app",
      "blog.localhost",
      "*.blog.localhost",
    ],
  },
  trustedOrigins: ["https://*.vercel.app"],
  disabledPaths: ["/token"],
  database: drizzleAdapter(db, { provider: "pg", schema }),
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
      productionURL: process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : "https://ruchern.dev",
    }),
    bearer(),
    jwt(),
    oauthProvider({
      loginPage: "/login",
      consentPage: "/consent",
      allowDynamicClientRegistration: true,
      allowUnauthenticatedClientRegistration: true,
      // "openid" keeps this an OIDC server; "mcp" gates access to the MCP API
      // (see validateMcpAuth) so an identity-only token cannot write content.
      scopes: ["openid", "profile", "email", "offline_access", "mcp"],
    }),
    nextCookies(), // Must be the last plugin
  ],
  session: {
    storeSessionInDatabase: true,
  },
});
