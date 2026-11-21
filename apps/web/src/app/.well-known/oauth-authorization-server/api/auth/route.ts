import { oauthProviderAuthServerMetadata } from "@better-auth/oauth-provider";
import { auth } from "@/lib/auth";

/**
 * RFC 8414 authorization-server metadata for the `/api/auth` issuer. Section 3
 * inserts `/.well-known/oauth-authorization-server` before the issuer's path,
 * which lands outside the `/api/auth/*` handler.
 */
export const GET = oauthProviderAuthServerMetadata(auth);
