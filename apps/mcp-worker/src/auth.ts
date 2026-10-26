import {
  createRemoteJWKSet,
  customFetch,
  type FetchImplementation,
  jwtVerify,
} from "jose";
import { AUTH_ERROR } from "@/constants/auth-error-ids";
import {
  MCP_WORKER_RESOURCE,
  OAUTH_RESOURCE,
} from "@/lib/api/oauth-protected-resource";
import { type McpAuthResult, resolveOAuthUser } from "@/lib/api/oauth-user";
import { logWarning } from "@/lib/logger";

export type { McpAuthResult };

/**
 * How long a colo keeps the provider JWKS, in seconds. A rotated key is only
 * picked up once this expires, so keep it short of any rotation overlap.
 */
const JWKS_CACHE_TTL = 3600;

/** The slice of the Workers Cache API that `caches.default` exposes. */
interface EdgeCache {
  match(url: string): Promise<Response | undefined>;
  put(url: string, response: Response): Promise<void>;
}

/**
 * Fetches the JWKS through the colo's cache, so a fresh isolate does not pay
 * a round trip to the web app on every cold start. Falls back to a plain
 * fetch where `caches.default` is missing (tests, `wrangler dev`).
 */
export const fetchJwksCached: FetchImplementation = async (url, options) => {
  const cache = (globalThis as { caches?: { default?: EdgeCache } }).caches
    ?.default;
  if (!cache) return fetch(url, options);

  const cached = await cache.match(url);
  if (cached) return cached;

  const response = await fetch(url, options);
  if (response.ok) {
    await cache.put(
      url,
      new Response(await response.clone().arrayBuffer(), {
        headers: {
          "Cache-Control": `max-age=${JWKS_CACHE_TTL}`,
          "Content-Type":
            response.headers.get("Content-Type") ?? "application/json",
        },
      }),
    );
  }
  return response;
};

/** Provider JWKS, cached per isolate by jose and per colo by the Cache API. */
const jwks = createRemoteJWKSet(new URL(`${OAUTH_RESOURCE}/jwks`), {
  [customFetch]: fetchJwksCached,
});

/** An RFC 6749 scope-token, as Better Auth validates it. */
const SCOPE_TOKEN = /^[\x21\x23-\x5b\x5d-\x7e]+$/;

/**
 * Validates MCP API authentication the same way the Next.js app's
 * `validateMcpAuth` does, but with jose instead of Better Auth: the bearer
 * must be a JWT access token verified against the provider's JWKS, whose
 * issuing client is still active and whose subject is a known user.
 *
 * @param request - The incoming HTTP request
 * @returns Auth result on success, null on failure
 */
export async function validateMcpAuth(
  request: Request,
): Promise<McpAuthResult | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice("Bearer ".length);

  try {
    // Clients request the Worker's own URL as the resource, so it is the
    // token's `aud`; the provider still signs as its issuer (BASE_URL +
    // /api/auth), not the bare origin.
    const { payload } = await jwtVerify(token, jwks, {
      audience: MCP_WORKER_RESOURCE,
      issuer: OAUTH_RESOURCE,
    });

    // Like Better Auth's verifyBearerToken, refuse DPoP-bound tokens: a
    // bearer alone does not prove possession of the bound key.
    const confirmation = payload.cnf as { jkt?: unknown } | undefined;
    if (confirmation?.jkt) {
      throw new Error("DPoP-bound access token presented as a bearer");
    }

    // Like Better Auth's parseGrantedScopes, reject a malformed scope claim
    // (not a string, empty, or with an empty or invalid scope token).
    const { scope } = payload;
    if (
      scope !== undefined &&
      (typeof scope !== "string" ||
        !scope.split(" ").every((token) => SCOPE_TOKEN.test(token)))
    ) {
      throw new Error("access token scope claim is invalid");
    }

    return await resolveOAuthUser(token, payload);
  } catch (error) {
    logWarning("OAuth access token verification failed", {
      errorId: AUTH_ERROR.OAUTH_TOKEN_VALIDATION_FAILED,
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
