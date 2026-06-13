# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

- `pnpm dev` - Start the web development server via Turborepo
- `pnpm build` - Build all workspace packages
- `pnpm start` - Start the web production server
- `pnpm lint` - Run linting across workspaces with Biome
- `pnpm format` - Format code with Biome
- `pnpm typecheck` - TypeScript type checking across workspaces

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

### Testing

- `pnpm test` - Run all tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm --filter @workspace/web test <path>` - Run a specific web test file

### Release

- `pnpm release` - Create semantic release

### Usage Analytics Ingestion

- `pnpm usage:ingest` - Parse local agent logs, price them, and upsert daily
  `token_usage` aggregates into the `DATABASE_URL` database (local dev branch)
- `pnpm usage:ingest:prod` - Same parse/price step locally, but POST the rows to
  the deployed `POST /api/usage/ingest` route, which upserts them using the
  deployment's own production `DATABASE_URL` (the prod connection string never
  touches the local machine). Requires `BLOG_MCP_AUTH_TOKEN` and Vercel's
  `VERCEL_PROJECT_PRODUCTION_URL` (or `VERCEL_URL`) in the environment.

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

The app is its own OAuth 2.1 / OIDC provider via Better Auth's `oidcProvider`
plugin (`apps/web/src/lib/auth.ts`). Clients authenticate users with the
Authorization Code flow (PKCE required) and use the issued access token as a
bearer against protected routes (e.g. `POST /api/usage/ingest`). Public clients
(no secret) are supported and clients self-register via dynamic client
registration.

- **Discovery:** `/api/auth/.well-known/openid-configuration`
- **Endpoints:** `/api/auth/oauth2/authorize`, `/api/auth/oauth2/token`, `/api/auth/oauth2/userinfo`, `/api/auth/oauth2/register`
- **Schema:** `oauthApplication`, `oauthAccessToken`, `oauthConsent` (`apps/web/src/schema/oauth.ts`)
- **Token validation:** `validateMcpAuth` (`lib/api/mcp-auth.ts`) resolves an OAuth bearer by looking the access token up in `oauthAccessToken`, checking expiry, and loading the owning user/role.

### Client flow

1. Register a client at `POST /api/auth/oauth2/register` (e.g. a public client with `token_endpoint_auth_method: "none"` and a custom redirect URI), or configure a trusted client in the plugin options.
2. Generate a PKCE `code_verifier` → `code_challenge` (S256).
3. Authorize: `GET /api/auth/oauth2/authorize?response_type=code&client_id=…&redirect_uri=…&code_challenge=…&code_challenge_method=S256&scope=openid%20email&state=…`.
4. Exchange the code at `POST /api/auth/oauth2/token` for an access (and refresh) token.
5. Send `Authorization: Bearer <access_token>` to protected routes.

## Architecture Overview

A pnpm/Turborepo monorepo for the Next.js 16 portfolio website, private MCP server, and usage tooling.

### Tech Stack

- **Framework**: Next.js 16.1 with App Router and React 19.2
- **Monorepo**: pnpm workspaces with Turborepo
- **Content**: Database-backed MDX with next-mdx-remote
- **Database**: Neon PostgreSQL with Drizzle ORM
- **Storage**: Cloudflare R2 for media assets
- **Authentication**: Better Auth with OAuth (GitHub, Google); also acts as an OAuth 2.1 / OIDC provider (`oidcProvider`)
- **Cache**: Upstash Redis for related posts, analytics, and post statistics
- **UI**: HeroUI v3 — Pro (`@heroui-pro/react`) + OSS (`@heroui/react`)
- **Styling**: Tailwind CSS v4
- **Testing**: Vitest with React Testing Library
- **Code Quality**: Biome for linting/formatting, TypeScript strict mode

### Key Features

- **Blog System**: Database-backed MDX with automatic metadata generation
- **Content Studio**: CMS at `/studio` for managing posts and media
- **Post Statistics**: Client-side views tracking (likes temporarily disabled)
- **Related Posts**: Tag-based recommendations using Jaccard similarity
- **OpenGraph Images**: Dynamic OG image generation via `opengraph-image.tsx` route files
- **Series Support**: Organise posts into series with navigation and ordering
- **Analytics**: PostHog-backed dashboard (Query API) with Vercel Analytics
- **LLM SEO**: Dynamic `/llms.txt` endpoint for LLM crawlers
- **RSS Feed**: Dynamic `/feed.xml` endpoint
- **OAuth Provider**: The app is its own OAuth 2.1 / OIDC provider via Better Auth's `oidcProvider`. Clients authenticate users with the Authorization Code flow (PKCE required) and use the issued access token as a bearer; public clients self-register via dynamic client registration. Discovery at `/api/auth/.well-known/openid-configuration`. Protected routes resolve OAuth bearers in `validateMcpAuth` (`lib/api/mcp-auth.ts`)

### Temporary Changes

- **Likes Feature Disabled**: The likes functionality is currently commented out to enable static generation of blog
  post pages. The code is preserved in comments for potential future re-enablement. Views are now tracked client-side
  using React 19's `useEffectEvent`.

### Project Structure

```
apps/
└── web/              # @workspace/web Next.js app for ruchern.dev
    ├── src/app/      # App Router routes, Studio, API routes, and auth pages
    ├── src/components/
    ├── src/lib/      # Web-owned queries, services, API utilities, and OG helpers
    ├── src/schema/   # Drizzle ORM database schemas
    ├── public/
    └── migrations/
packages/
├── mcp/              # @workspace/mcp private MCP server package
└── usage/            # @workspace/usage usage parsers, pricing, and heatmap helpers
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
- `BLOG_MCP_AUTH_TOKEN` - Static bearer for headless MCP/CLI clients (remote MCP server, `usage:ingest:prod`). Retained alongside OAuth; slated for removal once those clients migrate. The OAuth provider itself needs no extra env vars

## Code Conventions

### Language

**Use English (Singapore)** for all content:

- British English spelling (e.g., "colour", "optimise", "centre")
- Date format: DD/MM/YYYY or DD Month YYYY
- Time format: 24-hour (e.g., 14:30)

### File Structure

- TypeScript strict mode with app-local path aliases (`@/*`) and private workspace packages (`@workspace/*`)
- kebab-case for filenames
- Tests in `__tests__/` directories
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
- Use `cn()` utility for conditional class merging
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

- Update CLAUDE.md when changing commands or architecture
- Update README.md when modifying tech stack

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:ca08a54f -->

## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd dolt push
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**

- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds

<!-- END BEADS INTEGRATION -->
