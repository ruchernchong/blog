import { oauthProviderAuthServerMetadata } from "@better-auth/oauth-provider";
import { auth } from "@/lib/auth";

/**
 * RFC 8414 authorization-server metadata at the origin root, where clients and
 * scanners that do not know the `/api/auth` issuer path look first. The
 * path-inserted form for the issuer is served by `./api/auth/route.ts`.
 *
 * The document only changes on deploy, which clears the CDN cache, so the CDN
 * keeps it for a day rather than booting a function on every MCP client probe.
 */
export const GET = oauthProviderAuthServerMetadata(auth, {
  headers: {
    "Cache-Control":
      "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800",
  },
});
