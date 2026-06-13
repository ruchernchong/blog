# blog

## What this codebase does

Personal blog and portfolio at ruchern.dev. Next.js 16 App Router + React 19, pnpm/Turborepo monorepo. Blog content is database-backed MDX (Neon PostgreSQL via Drizzle ORM); media stored in Cloudflare R2. Authenticated admin users manage content via a CMS at `/studio`. The app also acts as an OAuth 2.1 / OIDC provider (via `@better-auth/oauth-provider`) and exposes a private MCP server at `/api/mcp` for agentic blog management. Public readers are unauthenticated.

## Auth shape

- `requireAuth(action)` — session guard for any authenticated user (`lib/api/auth.ts`). Used on Studio read routes.
- `requireAdmin()` — additionally checks `session.user.role === "admin"` (`lib/api/auth.ts`). Used on all Studio write/mutation routes (`/api/studio/**`).
- `validateMcpAuth(request)` — layered auth for `/api/mcp`: (1) Better Auth session, (2) OAuth JWT verified via `serverClient.verifyAccessToken` (local JWKS) with disabled-client check, (3) deprecated static `BLOG_MCP_AUTH_TOKEN` fallback. Returns `McpAuthResult | null`.
- `requireMcpAuth(request)` — wraps `validateMcpAuth`, additionally enforces the `mcp` scope on OAuth tokens (type `"oauth"`). Session and static-token paths skip the scope check.
- `auth` (Better Auth instance) — plugins: `admin()`, `jwt()`, `bearer()`, `oauthProvider()`, `oAuthProxy()`. Google is the only social provider; sign-up is disabled (`disableSignUp: true`).

## Threat model

The highest-impact targets are: (1) achieving RCE or stored XSS against public readers via CMS content fields (post title, summary, MDX, Mermaid diagrams) rendered without escaping; (2) escalating from an authenticated non-admin user to content writer or MCP mutation access; (3) abusing the open OAuth dynamic client registration to obtain tokens with unintended scopes or impersonate the provider. SSRF via `upload_from_url` in the MCP media tools is secondary — the endpoint requires authentication, but a compromised or malicious MCP client could reach internal metadata URLs.

## Project-specific patterns to flag

- **JSON-LD without script-safe escaping** — `StructuredData` (`app/components/structured-data.tsx`) serialises props with `JSON.stringify` and writes to `dangerouslySetInnerHTML`. `JSON.stringify` does not escape `<`/`</script>`. Post title and summary feed this component via the blog page.
- **Mermaid `securityLevel: 'loose'`** — `app/(main)/blog/components/mermaid.tsx` initialises Mermaid with `securityLevel: 'loose'` then injects the SVG output via `dangerouslySetInnerHTML` with no sanitiser. Mermaid source comes from post MDX content.
- **`upload_from_url` server-side fetch** — `packages/mcp/src/tools/media.tools.ts` accepts a caller-supplied URL and calls `fetch(url)` with no host allowlist, private-IP blocking, or redirect limit. Reachable via the authenticated `/api/mcp` endpoint.
- **MCP mutation tools gated only by `mcp` scope, not role** — `requireMcpAuth` enforces the `mcp` scope on OAuth tokens but does not check `user.role`. Studio mutation routes (`/api/studio/**`) require `requireAdmin()`. The MCP path is therefore more permissive than the Studio path for the same operations.

## Known false-positives

- `/api/auth/oauth2/*` and `/api/auth/.well-known/openid-configuration` — intentionally public OAuth 2.1 / OIDC endpoints (discovery, authorize, token, userinfo, register, introspect, JWKS).
- `/.well-known/oauth-protected-resource` — intentionally public per RFC 9728; returns resource metadata for MCP clients.
- `allowDynamicClientRegistration: true` + `allowUnauthenticatedClientRegistration: true` in `oauthProvider` — intentional; clients self-register per RFC 7591. Flag unexpected `scope` values in registered clients, not the registration endpoint itself.
- `BLOG_MCP_AUTH_TOKEN` static bearer in `validateMcpAuth` — deprecated fallback, intentionally retained until headless clients migrate to OAuth. The branch is marked for removal in a `TODO(remove)` comment.
- `disabledPaths: ["/token"]` in the Better Auth config — intentional; the OAuth token endpoint is served by `oauthProvider` at `/api/auth/oauth2/token`, not the default Better Auth path.
