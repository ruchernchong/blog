import { oauthProviderAuthServerMetadata } from "@better-auth/oauth-provider";
import { auth } from "@/lib/auth";

/**
 * RFC 8414 authorization-server metadata at the origin root, where clients and
 * scanners that do not know the `/api/auth` issuer path look first. The
 * path-inserted form for the issuer is served by `./api/auth/route.ts`.
 */
export const GET = oauthProviderAuthServerMetadata(auth);
