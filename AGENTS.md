# AGENTS.md

This file provides guidance to coding agents when working with code in this repository.

## Commands

### Development

- `pnpm dev` - Start the web development server via Turborepo (served on a `portless` `.localhost` URL, not raw `localhost:3000`)
- `pnpm build` - Build all workspace packages
- `pnpm start` - Start the web production server
- `pnpm lint` - Run linting across workspaces with Biome
- `pnpm knip` - Find unused files, exports, and dependencies (root config in `knip.json`; `.deepsec` is vendored and ignored)
- `pnpm format` - Format code with Biome
- `pnpm typecheck` - TypeScript type checking across workspaces

### Documentation Site

- `pnpm docs:dev` - Start the `@workspace/docs` Fumadocs site (Next.js + `fumadocs-ui`/`fumadocs-mdx`)
- `pnpm docs:build` - Build the docs site
- `pnpm docs:typecheck` - Type check the docs site

### Database

- `pnpm db:generate` - Generate migrations from schema
- `pnpm db:migrate` - Run database migrations
- `pnpm db:push` - Push schema changes to database
- `pnpm db:pull` - Pull schema from existing database
- `pnpm db:check` - Check migration consistency
- `pnpm db:up` - Run pending migrations
- `pnpm db:drop` - Drop database tables
- `pnpm db:studio` - Open Drizzle Studio
- `pnpm db:seed` - Seed database with test data
- `pnpm auth:generate` - Regenerate the Better Auth Drizzle schema (core + `jwt`/OAuth provider tables) into `apps/web/src/schema/auth.ts`

### Testing

- `pnpm test` - Run all tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm --filter @workspace/web test <path>` - Run a specific web test file
- Web tests use Vitest projects: `*.test.ts` run in `node`, `*.test.tsx` run in Chromium via Browser Mode (`vitest-browser-react`). First run needs `pnpm --filter @workspace/web exec playwright install chromium`

### Release

- `pnpm release` - Create semantic release

### Usage Analytics Ingestion

Model pricing/metadata is a DB-backed registry (the `model` table), synced on
each ingest from **LiteLLM** (primary rates) + **models.dev** (display names,
release dates, rate gap-fill) + curated MCP-editable overrides (`is_override`
rows, which win the merge). This replaces the former hardcoded pricing constants
so a newly-released model prices automatically once a live source lists it; an
override is the no-deploy fix for internal/routed slugs no public source carries.
See `apps/web/src/lib/usage/registry.ts` (pure normalise/merge) and
`apps/web/src/lib/queries/models.ts` (`syncModelRegistry`).

- `pnpm usage:login` / `pnpm usage:measure` / `pnpm usage:ingest` - Rust collector
  (`packages/usage/rust`), run via `turbo run @workspace/usage#…`. Parses Claude, Codex,
  OpenCode, Cursor, and Grok on this machine. `ingest` POSTs daily rows with
  `costUsd: null` to `POST /api/usage/ingest`, which upserts them with that server's
  own `DATABASE_URL`, prices them, and syncs the model registry. The target is
  `USAGE_INGEST_URL` (set to `https://blog.localhost/api/usage/ingest` in the local
  `.envrc`), defaulting to production. Login (OAuth, admin account, Keychain) follows
  the same server, and each non-production server gets its own Keychain entry, so
  local and production logins never mix. `USAGE_INGEST_DRY_RUN=1` prints the payload
  without POSTing. The installed binary is production only. semantic-release keeps
  its `Cargo.toml` version in sync with the monorepo release, and it prints a once-a-day update notice
  in interactive terminals (`USAGE_INGEST_NO_UPDATE_CHECK=1` disables it). Install
  (LaunchAgent): `curl | bash`
  `packages/usage/rust/macos/install-remote.sh` pulls the prebuilt binary from the
  latest monorepo release (`ci.yml` runs `usage-ingest-build.yml` after semantic-release
  and attaches the package); `install.sh` builds from a checkout. See
  README.md “Usage collector (macOS)” and `packages/usage/rust/macos/INSTALL.md`.

AgentUsage may also POST session-level `effortRows` into `token_effort_usage`
(alongside token rows); the `/usage` page folds these into an all-time effort
distribution. Local CLI parsers do not emit effort.

### MCP Server

- `pnpm mcp` - Start the private workspace MCP server for blog management

## MCP Server

An MCP (Model Context Protocol) server for managing blog posts and media via Claude Code.

### Available Tools

**Post Tools:**

- `list_posts` - List posts with optional status/limit/offset filters
- `get_post` - Get single post by ID or slug
- `create_post` - Create new post with auto-generated metadata
- `update_post` - Update existing post
- `delete_post` - Soft delete a post
- `restore_post` - Restore soft-deleted post
- `publish_post` - Publish a draft (sets publishedAt)

**Media Tools:**

- `list_media` - List uploaded media with search
- `get_media` - Get single media item
- `request_upload` - Get presigned R2 upload URL
- `confirm_upload` - Confirm upload and create database record
- `upload_from_path` - Upload image directly from local file path
- `upload_from_url` - Upload image from a public URL
- `delete_media` - Soft delete media

**Model Registry Tools:**

- `list_model_overrides` - List curated pricing overrides (`model` rows with `is_override`), optional provider filter
- `get_model` - Get a single model registry row by (provider, id) with merged pricing/metadata + source provenance
- `upsert_model_override` - Create/update a curated pricing/metadata/alias override (rates USD per 1M tokens); wins over the live LiteLLM/models.dev sources and reprices N.A. rows immediately
- `delete_model_override` - Delete a curated override (only `is_override` rows; source-derived rows are refreshed on the next ingest)

### Configuration

The MCP server is configured in `.mcp.json` and uses stdio transport for local CLI integration.

### Remote Access

The MCP server is also available as a serverless API route for remote access from Claude Desktop, Claude Code, or the
Claude mobile app.

**Endpoint:** `https://ruchern.dev/api/mcp`

**Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "blog": {
      "url": "https://ruchern.dev/api/mcp",
      "auth": {
        "type": "bearer",
        "token": "your-mcp-auth-token"
      }
    }
  }
}
```

**Claude Code** (`.mcp.json` or global settings):

```json
{
  "mcpServers": {
    "blog-remote": {
      "type": "http",
      "url": "https://ruchern.dev/api/mcp",
      "headers": {
        "Authorization": "Bearer ${BLOG_MCP_AUTH_TOKEN}"
      }
    }
  }
}
```

## OAuth Provider

The app is its own OAuth 2.1 / OIDC provider via the `@better-auth/oauth-provider`
plugin (`oauthProvider`) paired with the `jwt()` plugin (`apps/web/src/lib/auth.ts`).
Clients authenticate users with the Authorization Code flow (PKCE required) and use
the issued access token as a bearer against protected routes (e.g.
`POST /api/usage/ingest`). Public clients (no secret) are supported and clients
self-register via dynamic client registration. The required consent screen lives at
`/consent` (`apps/web/src/app/consent/`).

- **Discovery:** `/api/auth/.well-known/openid-configuration`; MCP clients also read RFC 9728 protected-resource metadata at `/.well-known/oauth-protected-resource` (`apps/web/src/app/.well-known/oauth-protected-resource/route.ts`)
- **Endpoints:** `/api/auth/oauth2/authorize`, `/api/auth/oauth2/token`, `/api/auth/oauth2/userinfo`, `/api/auth/oauth2/register`, `/api/auth/oauth2/introspect`, plus JWKS at `/api/auth/jwks`
- **Scopes:** `openid`, `profile`, `email`, `offline_access`, and `mcp` (configured in `oauthProvider`). The `mcp` scope gates the MCP API — a token without it gets `403 insufficient_scope`
- **Schema:** `oauthClient`, `oauthAccessToken`, `oauthRefreshToken`, `oauthConsent`, and `jwks` — generated via `pnpm auth:generate` into `apps/web/src/schema/auth.ts` (no separate `oauth.ts`)
- **Token validation:** `validateMcpAuth` (`lib/api/mcp-auth.ts`) verifies an OAuth bearer with `verifyAccessToken` from `better-auth/oauth2`, passing an explicit `jwksUrl` (`${OAUTH_RESOURCE}/jwks`) for local JWKS verification, then rejects tokens from a disabled `oauthClient` and loads the owning user/role by the token subject. The `/api/mcp` route additionally requires the `mcp` scope. Access/refresh tokens are stored hashed.

### Client flow

1. Register a client at `POST /api/auth/oauth2/register` (e.g. a public client with `token_endpoint_auth_method: "none"` and a custom redirect URI), or configure a trusted client in the plugin options.
2. Generate a PKCE `code_verifier` → `code_challenge` (S256).
3. Authorize: `GET /api/auth/oauth2/authorize?response_type=code&client_id=…&redirect_uri=…&code_challenge=…&code_challenge_method=S256&scope=openid%20email%20mcp&resource=<api base url>&state=…`. Include the `mcp` scope for MCP API access. Pass `resource` (RFC 8707) so the access token is issued as a JWT verifiable via JWKS; the user approves at `/consent`.
4. Exchange the code at `POST /api/auth/oauth2/token` for an access (and refresh) token.
5. Send `Authorization: Bearer <access_token>` to protected routes.

## Architecture Overview

A pnpm/Turborepo monorepo for the Next.js 16 portfolio website, private MCP server, and usage tooling.

### Tech Stack

- **Framework**: Next.js 16.3 with App Router and React 19.2
- **Monorepo**: pnpm workspaces with Turborepo
- **Content**: Database-backed MDX with next-mdx-remote
- **Database**: Neon PostgreSQL with Drizzle ORM
- **Storage**: Cloudflare R2 for media assets
- **Authentication**: Better Auth with OAuth (GitHub, Google); also acts as an OAuth 2.1 / OIDC provider (`@better-auth/oauth-provider` + `jwt()`)
- **Cache**: Upstash Redis for related posts, analytics, and post statistics
- **UI**: HeroUI v3 — Pro (`@heroui-pro/react`) + OSS (`@heroui/react`)
- **Styling**: Tailwind CSS v4
- **Testing**: Vitest (Node for `*.test.ts`, headless Chromium Browser Mode with `vitest-browser-react` for `*.test.tsx`)
- **Code Quality**: Biome for linting/formatting, TypeScript 7 (strict mode)

### Key Features

- **Blog System**: Database-backed MDX with automatic metadata generation
- **Content Studio**: CMS at `/studio` for managing posts and media
- **Post Statistics**: Client-side views tracking (likes temporarily disabled)
- **Related Posts**: Tag-based recommendations using Jaccard similarity
- **OpenGraph Images**: Dynamic OG image generation via `opengraph-image.tsx` route files
- **Series Support**: Organise posts into series with navigation and ordering
- **Analytics**: PostHog-backed dashboard (Query API) with Vercel Analytics
- **Usage Page**: Public `/usage` page built from the cached `getUsageProfile()` (`lib/queries/usage.ts`). An editorial top half (generated summary, heatmap, "This period", stack shift, model character, cost vs volume, cache & effort) sits over an Explorer (DataGrid on desktop, card list on phones). A `?model=` profile drawer opens from the "View profile" buttons in Model character. Pure aggregation and shaping live in `lib/usage/` (`narrative`, `period-comparison`, `weekly-insights`, `model-character`). Identity charts use the validated `--series-*` tokens in `globals.css`; magnitude uses the coral `--chart-*` ramp
- **LLM SEO**: Dynamic `/llms.txt` endpoint for LLM crawlers
- **RSS Feed**: Dynamic `/feed.xml` endpoint
- **OAuth Provider**: The app is its own OAuth 2.1 / OIDC provider via `@better-auth/oauth-provider` (`oauthProvider`) with the `jwt()` plugin. Clients authenticate users with the Authorization Code flow (PKCE required) and use the issued JWT access token as a bearer; public clients self-register via dynamic client registration and approve access at `/consent`. Discovery at `/api/auth/.well-known/openid-configuration`. Protected routes verify OAuth bearers in `validateMcpAuth` (`lib/api/mcp-auth.ts`) via `verifyAccessToken` from `better-auth/oauth2` with an explicit JWKS URL (local JWKS)

### Temporary Changes

- **Likes Feature Disabled**: The likes functionality is currently commented out to enable static generation of blog
  post pages. The code is preserved in comments for potential future re-enablement. Views are now tracked client-side
  using React 19's `useEffectEvent`.

### Project Structure

```
apps/
├── web/              # @workspace/web Next.js app for ruchern.dev
│   ├── src/app/      # App Router routes, Studio, API routes, and auth pages
│   ├── src/components/
│   ├── src/lib/      # Web-owned queries, services, API utilities, and OG helpers
│   ├── src/schema/   # Drizzle ORM database schemas
│   ├── public/
│   └── migrations/
└── docs/             # @workspace/docs Fumadocs documentation site
packages/
├── mcp/              # @workspace/mcp private MCP server package
└── usage/            # @workspace/usage Rust usage collector (`usage-ingest`)
```

### Layered Architecture

1. **Database Layer** (`lib/queries/`) - Pure Drizzle ORM queries
2. **Service Layer** (`lib/services/`) - Business logic with class-based services
3. **API Utilities** (`lib/api/`) - Standardised route handlers
4. **tRPC Layer** (`server/`) - Type-safe API procedures for GitHub and analytics
5. **Actions** (`app/_actions/`) - Server actions for mutations only

### Database

- **PostgreSQL**: Schema in `apps/web/src/schema/` (posts, sessions, media, auth)
- **Redis**: Post stats, popular posts, related posts cache, analytics

## Environment Variables

See `apps/web/.env.example` for all required variables:

- `NEXT_PUBLIC_BASE_URL` - Base URL for the application (e.g., https://ruchern.dev)
- `DATABASE_URL` - Neon PostgreSQL connection string
- `UPSTASH_REDIS_REST_URL/TOKEN` - Redis connection
- `BETTER_AUTH_SECRET/URL` - Authentication
- `GITHUB_CLIENT_ID/SECRET` - GitHub OAuth
- `GOOGLE_CLIENT_ID/SECRET` - Google OAuth
- `GH_ACCESS_TOKEN` - GitHub API access token for repository data
- `IP_SALT` - Salt for hashing IP addresses (privacy protection)
- `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` - PostHog project token from the Vercel integration
- `NEXT_PUBLIC_POSTHOG_HOST` - PostHog ingest host from the Vercel integration, using EU Cloud
- `POSTHOG_PROJECT_ID` - PostHog numeric project ID for server-side Query API
- `POSTHOG_API_KEY` - PostHog Personal API Key with `query:read` scope
- `CLOUDFLARE_ACCOUNT_ID` - R2 storage
- `R2_ACCESS_KEY_ID/SECRET_ACCESS_KEY/BUCKET_NAME/PUBLIC_URL` - R2 config
- `BLOG_MCP_AUTH_TOKEN` - Static bearer for headless MCP/CLI clients (remote MCP server). Retained alongside OAuth; slated for removal once the remote MCP server migrates. The OAuth provider itself needs no extra env vars

## Code Conventions

### Language

**Use English (Singapore)** for all content:

- British English spelling (e.g., "colour", "optimise", "centre")
- Date format: DD/MM/YYYY or DD Month YYYY
- Time format: 24-hour (e.g., 14:30)

### File Structure

- TypeScript strict mode with app-local path aliases (`@/*`) and private workspace packages (`@workspace/*`)
- kebab-case for filenames
- New tests are colocated with their source as `*.test.{ts,tsx}` (e.g. `usage-hero.tsx` + `usage-hero.test.tsx`)
- Named exports preferred

### Testing

- Use `it("should...")` convention for test descriptions
- Mock external dependencies (database, cache, APIs)
- Test behaviour, not implementation details

### Components

- **Use HeroUI for UI**: HeroUI Pro (`@heroui-pro/react`) first, then HeroUI OSS
  (`@heroui/react`) as fallback. shadcn has been fully removed.
- HeroUI v3 conventions: `onPress` (not `onClick`), `isDisabled` (not `disabled`), compound
  components (`Card.Header`, `Select.Trigger`, `Modal.Backdrop`); `TextField` owns controlled
  `value`/`onChange(string)`; badges are `Chip`; style links as buttons with
  `buttonVariants()` from `@heroui/styles` on a Next `Link` (avoid `render` props)
- Icons come from `@hugeicons/*` (HeroUI ships none)
- Use `cn()` from `@heroui/react` for conditional class merging
- Follow component-naming skill conventions

### Tailwind CSS v4

- CSS-based configuration in `apps/web/src/app/globals.css`
- OKLCH colour space for semantic tokens
- Use `flex gap-*` instead of `space-y-*` or `space-x-*`
- Use even spacing values: `gap-2, gap-4, gap-6, gap-8, gap-12`
- Prefer `margin-bottom` over `margin-top`
- Semantic colours: `foreground`, `muted`, `accent`, `border`, `background`, `primary`

### Error Handling

- Use `ERROR_IDS` from `@/constants/error-ids` for consistent logging
- Use `logError()`, `logWarning()`, `logInfo()` from `@/lib/logger`
- API routes use utilities from `@/lib/api/` for standardised responses

## Claude Code Skills

Project-specific skills are available in `.claude/skills/`:

- **component-naming** - React component naming conventions (PascalCase, Domain+Role pattern, compound components)
- **design-language-system** - Visual design tokens (coral OKLCH colours, typography, spacing, animations)
- **blog-voice** - Personal writing voice for blog posts on ruchern.dev (Singapore English, structural patterns,
  anti-patterns)

Invoke skills with `/component-naming`, `/design-language-system`, or `/blog-voice` when relevant.

## Documentation

- Update AGENTS.md when changing commands or architecture
- Update README.md when modifying tech stack


<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Prefer the Next.js docs bundled with the app at `apps/web/node_modules/next/dist/docs/` (or the nearest `node_modules/next/dist/docs/`) before writing Next.js code. Heed deprecation notices.

**Keep this block.** It mirrors the managed agent rules Next maintains under `apps/web/AGENTS.md`. Do not restore the legacy `NEXT-AGENTS-MD` / `.next-docs` index.
<!-- END:nextjs-agent-rules -->
