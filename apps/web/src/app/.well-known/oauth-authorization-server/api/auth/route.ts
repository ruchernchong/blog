import { oauthProviderAuthServerMetadata } from "@better-auth/oauth-provider";
import { auth } from "@/lib/auth";

/**
 * RFC 8414 authorization-server metadata for the `/api/auth` issuer. Section 3
 * inserts `/.well-known/oauth-authorization-server` before the issuer's path,
 * which lands outside the `/api/auth/*` handler.
 *
 * Cached at the CDN like the root document in `../../route.ts`.
 */
export const GET = oauthProviderAuthServerMetadata(auth, {
  headers: {
    "Cache-Control":
      "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800",
  },
});
