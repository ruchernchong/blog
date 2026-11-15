# OAuth Provider Integration

How a client application authenticates users and calls protected ruchern.dev routes using the OAuth 2.1 / OIDC provider.

ruchern.dev is its own OAuth 2.1 / OIDC provider. A client application authenticates a user through the Authorization Code flow with PKCE, receives a JWT access token, and sends that token as a bearer against protected routes such as `POST /api/usage/ingest`.

The provider is implemented with the `@better-auth/oauth-provider` plugin (`oauthProvider`) paired with the `jwt()` plugin in `apps/web/src/lib/auth.ts`. Public clients (no secret) are supported, and clients self-register via dynamic client registration, so no manual provider-side configuration is required to onboard a new client.

## Discovery

Everything a client needs to configure itself is published at the discovery document.

```txt
GET /api/auth/.well-known/openid-configuration
```

```txt
https://ruchern.dev/api/auth/.well-known/openid-configuration
```

The JSON Web Key Set used to verify JWT access tokens is published at:

```txt
GET /api/auth/jwks
```

The same provider publishes RFC 8414 authorization server metadata. The issuer is `https://ruchern.dev/api/auth`, so the RFC 8414 location inserts the well-known segment before the issuer path. The bare root path serves the same document for clients that only probe the origin.

```txt
GET /.well-known/oauth-authorization-server/api/auth
GET /.well-known/oauth-authorization-server
GET /api/auth/.well-known/oauth-authorization-server
```

MCP clients can discover the authorization server from the MCP API's RFC 9728 protected-resource metadata, which is also advertised in the `WWW-Authenticate` header on a `401`/`403` from `/api/mcp`:

```txt
GET /.well-known/oauth-protected-resource
```

The authorization server metadata is also described in the site's OpenAPI document (`GET /openapi.json`), alongside the protected routes it fronts.

```txt
GET https://ruchern.dev/openapi.json
```

A request to an unmatched `/api/*` path returns `404` with a JSON body whose `hint` points at that document, rather than the HTML error page.

## Endpoints

| Purpose | Endpoint |
| --- | --- |
| Discovery | `/api/auth/.well-known/openid-configuration` |
| Authorize | `/api/auth/oauth2/authorize` |
| Token | `/api/auth/oauth2/token` |
| UserInfo | `/api/auth/oauth2/userinfo` |
| Dynamic client registration | `/api/auth/oauth2/register` |
| Token introspection | `/api/auth/oauth2/introspect` |
| JWKS | `/api/auth/jwks` |
| OpenAPI document (all public API routes) | `/openapi.json` |

## Supported Behaviour

- **Authorization Code flow with PKCE** — PKCE (`S256`) is required for all clients.
- **Public clients** — clients with `token_endpoint_auth_method: "none"` (no client secret) are supported.
- **Dynamic client registration** — clients register themselves at `/api/auth/oauth2/register`; unauthenticated registration is allowed.
- **Consent** — the user approves the requested scopes at `/consent` before a code is issued.

## Scopes

| Scope | Meaning |
| --- | --- |
| `openid` | Verify the user's identity (issues an ID token). |
| `profile` | Read basic profile information. |
| `email` | Read the user's email address. |
| `offline_access` | Issue a refresh token so the client can stay signed in. |
| `mcp` | Access the MCP API (`/api/mcp`). Required for any token used against MCP tools; an identity-only token is rejected with `403 insufficient_scope`. |

## Resources

The provider issues tokens for these RFC 8707 resources. Each protected endpoint only accepts a token whose `aud` is its own resource, and any other `resource` value returns `invalid_target`.

| Resource | Used for |
| --- | --- |
| `https://ruchern.dev/api/auth` | `POST /api/usage/ingest` (the provider issuer) |
| `https://ruchern.dev/api/mcp` | The MCP API at `/api/mcp` |
| `https://mcp.ruchern.dev/mcp` | The MCP Worker |
| `https://<project>.vercel.app/mcp` | The Vercel MCP server, only when `MCP_VERCEL_RESOURCE` is set |

The examples below use `https://ruchern.dev/api/auth`.

## Client Integration

### 1. Register the client

Register once at the dynamic client registration endpoint. A public client uses `token_endpoint_auth_method: "none"` and declares its redirect URI.

```bash
curl -X POST "https://ruchern.dev/api/auth/oauth2/register" \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "My Client",
    "redirect_uris": ["http://localhost:8765/callback"],
    "token_endpoint_auth_method": "none",
    "grant_types": ["authorization_code", "refresh_token"],
    "response_types": ["code"]
  }'
```

The response includes a `client_id`. Persist it; a public client has no secret to store.

### 2. Generate a PKCE pair

Create a random `code_verifier` and derive the `code_challenge` with SHA-256.

```txt
code_challenge = BASE64URL(SHA256(code_verifier))
code_challenge_method = S256
```

### 3. Send the user to authorize

Open the authorize URL in a browser. Pass `resource` (RFC 8707) set to the resource the token is for (see [Resources](#resources)) so the issued access token is a JWT verifiable via JWKS. The user signs in (if needed) and approves the scopes at `/consent`.

```txt
GET /api/auth/oauth2/authorize
  ?response_type=code
  &client_id=<client_id>
  &redirect_uri=<redirect_uri>
  &code_challenge=<code_challenge>
  &code_challenge_method=S256
  &scope=openid%20email%20mcp
  &resource=https://ruchern.dev/api/auth
  &state=<state>
```

Include the `mcp` scope when the token will be used against the MCP API, and set `resource` to that MCP endpoint's own URL; without the scope the MCP route rejects the token with `403 insufficient_scope`.

After approval the provider redirects to the client's `redirect_uri` with `code` and `state`.

### 4. Exchange the code for tokens

```bash
curl -X POST "https://ruchern.dev/api/auth/oauth2/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=<code>" \
  -d "redirect_uri=<redirect_uri>" \
  -d "client_id=<client_id>" \
  -d "code_verifier=<code_verifier>" \
  -d "resource=https://ruchern.dev/api/auth"
```

Pass `resource` in the token request body so Better Auth mints a JWT access token verifiable against the JWKS. Without it an opaque token is returned, which cannot be verified locally.

The response contains an `access_token` (JWT), and a `refresh_token` if `offline_access` was requested.

### 5. Call protected routes

Send the access token as a bearer.

```bash
curl -X POST "https://ruchern.dev/api/usage/ingest" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{ "rows": [] }'
```

### 6. Refresh the token

When `offline_access` was granted, exchange the refresh token for a new access token.

```bash
curl -X POST "https://ruchern.dev/api/auth/oauth2/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token" \
  -d "refresh_token=<refresh_token>" \
  -d "client_id=<client_id>" \
  -d "resource=https://ruchern.dev/api/auth"
```

Pass `resource` on every refresh request. Better Auth only mints a JWT access token when `resource` is present; omitting it returns an opaque token that cannot be verified locally.

## How the Server Validates a Token

Protected routes call `validateMcpAuth` (`apps/web/src/lib/api/mcp-auth.ts`). OAuth is the only accepted method: sessions and static tokens are rejected. The bearer JWT is verified locally against the provider's JWKS via `verifyBearerToken` from `better-auth/oauth2`, with `issuer` set to the provider issuer (`https://ruchern.dev/api/auth`) and `audience` set to the endpoint's own resource: the issuer for `/api/usage/ingest`, `https://ruchern.dev/api/mcp` for `/api/mcp`. The token's issuing client (`azp`) is checked against the `oauthClient` table and rejected if it has been disabled, then the owning user and role are loaded by the token `sub`. Both `/api/mcp` and `/api/usage/ingest` require the `admin` role.

Because the JWT carries the `resource`/audience as its `aud`, a client **must** pass `resource` at the authorize step for its token to validate against an API protected this way. The `azp` claim carries the client id and `scope` carries the granted scopes.

The MCP API additionally requires the `mcp` scope: `/api/mcp` returns `403 insufficient_scope` for an authenticated OAuth token that does not carry it, and `401` (both with a `WWW-Authenticate` challenge advertising the required scope and the protected-resource metadata URL) when no valid token is supplied.

Access and refresh tokens are stored hashed in the provider's database.

## Client Checklist

- Register a public client and store the returned `client_id`.
- Generate a fresh PKCE `code_verifier`/`code_challenge` per authorization.
- Pass the same `resource` at authorize **and** on every token request (exchange and refresh). It must be one of the registered [resources](#resources), matching the identifier the target endpoint publishes in its protected-resource metadata; any other value returns `invalid_target`. It is what makes the issued access token a verifiable JWT.
- Request `offline_access` if the client needs to refresh without re-prompting.
- Persist tokens securely; treat the JWT as opaque other than honouring its expiry.

## Source Files

- `apps/web/src/lib/auth.ts` configures the `oauthProvider` and `jwt()` plugins.
- `apps/web/src/lib/api/oauth-protected-resource.ts` defines the resources and their protected-resource metadata.
- `apps/web/src/lib/api/mcp-auth.ts` validates incoming bearers on protected routes.
- `apps/web/src/app/consent/` and `apps/web/src/components/auth/consent-form.tsx` render the consent screen.
- `apps/web/src/schema/auth.ts` holds the `oauthClient`, `oauthAccessToken`, `oauthRefreshToken`, `oauthConsent`, and `jwks` tables (generated via `pnpm auth:generate`).
- `apps/web/src/app/.well-known/oauth-authorization-server/` serves the RFC 8414 metadata at the origin and at the path-inserted issuer location.
- `apps/web/src/app/openapi.json/route.ts` builds the OpenAPI 3.1 document by hand; add a path there when adding a public API route.
