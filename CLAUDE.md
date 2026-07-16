# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

- `pnpm dev` - Start the web development server via Turborepo (served on a `portless` `.localhost` URL, not raw `localhost:3000`)
- `pnpm build` - Build all workspace packages
- `pnpm start` - Start the web production server
- `pnpm lint` - Run linting across workspaces with Biome
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

- **Framework**: Next.js 16.1 with App Router and React 19.2
- **Monorepo**: pnpm workspaces with Turborepo
- **Content**: Database-backed MDX with next-mdx-remote
- **Database**: Neon PostgreSQL with Drizzle ORM
- **Storage**: Cloudflare R2 for media assets
- **Authentication**: Better Auth with OAuth (GitHub, Google); also acts as an OAuth 2.1 / OIDC provider (`@better-auth/oauth-provider` + `jwt()`)
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

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:970c3bf2 -->
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

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.

## Agent Context Profiles

The managed Beads block is task-tracking guidance, not permission to override repository, user, or orchestrator instructions.

- **Conservative (default)**: Use `bd` for task tracking. Do not run git commits, git pushes, or Dolt remote sync unless explicitly asked. At handoff, report changed files, validation, and suggested next commands.
- **Minimal**: Keep tool instruction files as pointers to `bd prime`; use the same conservative git policy unless active instructions say otherwise.
- **Team-maintainer**: Only when the repository explicitly opts in, agents may close beads, run quality gates, commit, and push as part of session close. A current "do not commit" or "do not push" instruction still wins.

## Session Completion

This protocol applies when ending a Beads implementation workflow. It is subordinate to explicit user, repository, and orchestrator instructions.

1. **File issues for remaining work** - Create beads for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **Handle git/sync by active profile**:
   ```bash
   # Conservative/minimal/default: report status and proposed commands; wait for approval.
   git status

   # Team-maintainer opt-in only, unless current instructions forbid it:
   git pull --rebase
   bd dolt push
   git push
   git status
   ```
5. **Hand off** - Summarize changes, validation, issue status, and any blocked sync/commit/push step

**Critical rules:**
- Explicit user or orchestrator instructions override this Beads block.
- Do not commit or push without clear authority from the active profile or the current user request.
- If a required sync or push is blocked, stop and report the exact command and error.
<!-- END BEADS INTEGRATION -->

<!-- NEXT-AGENTS-MD-START -->[Next.js Docs Index]|root: ./.next-docs|STOP. What you remember about Next.js is WRONG for this project. Always search docs and read before any task.|If docs missing, run this command first: npx @next/codemod agents-md --output CLAUDE.md|01-app:{04-glossary.mdx}|01-app/01-getting-started:{01-installation.mdx,02-project-structure.mdx,03-layouts-and-pages.mdx,04-linking-and-navigating.mdx,05-server-and-client-components.mdx,06-fetching-data.mdx,07-mutating-data.mdx,08-caching.mdx,09-revalidating.mdx,10-error-handling.mdx,11-css.mdx,12-images.mdx,13-fonts.mdx,14-metadata-and-og-images.mdx,15-route-handlers.mdx,16-proxy.mdx,17-deploying.mdx,18-upgrading.mdx}|01-app/02-guides:{adopting-partial-prefetching.mdx,ai-agents.mdx,analytics.mdx,authentication.mdx,backend-for-frontend.mdx,caching-without-cache-components.mdx,cdn-caching.mdx,ci-build-caching.mdx,content-security-policy.mdx,css-in-js.mdx,custom-server.mdx,data-security.mdx,debugging.mdx,deploying-to-platforms.mdx,draft-mode.mdx,environment-variables.mdx,forms.mdx,how-revalidation-works.mdx,incremental-static-regeneration-cache-components.mdx,incremental-static-regeneration.mdx,instant-navigation.mdx,instrumentation.mdx,interactive-apps.mdx,internationalization.mdx,json-ld.mdx,lazy-loading.mdx,local-development.mdx,mcp.mdx,mdx.mdx,memory-usage.mdx,migrating-to-cache-components.mdx,multi-tenant.mdx,multi-zones.mdx,open-telemetry.mdx,package-bundling.mdx,ppr-platform-guide.mdx,prefetching.mdx,preserving-ui-state.mdx,preventing-flash-before-hydration.mdx,production-checklist.mdx,progressive-web-apps.mdx,public-static-pages.mdx,redirecting.mdx,rendering-philosophy.mdx,runtime-prefetching.mdx,sass.mdx,scripts.mdx,self-hosting.mdx,server-actions.mdx,single-page-applications.mdx,static-exports.mdx,streaming.mdx,tailwind-v3-css.mdx,third-party-libraries.mdx,videos.mdx,view-transitions.mdx}|01-app/02-guides/migrating:{app-router-migration.mdx,from-create-react-app.mdx,from-vite.mdx}|01-app/02-guides/testing:{cypress.mdx,jest.mdx,playwright.mdx,vitest.mdx}|01-app/02-guides/upgrading:{codemods.mdx,version-14.mdx,version-15.mdx,version-16.mdx}|01-app/03-api-reference:{07-edge.mdx,08-turbopack.mdx}|01-app/03-api-reference/01-directives:{use-cache-private.mdx,use-cache-remote.mdx,use-cache.mdx,use-client.mdx,use-server.mdx}|01-app/03-api-reference/02-components:{font.mdx,form.mdx,image.mdx,link.mdx,script.mdx}|01-app/03-api-reference/03-file-conventions/01-metadata:{app-icons.mdx,manifest.mdx,opengraph-image.mdx,robots.mdx,sitemap.mdx}|01-app/03-api-reference/03-file-conventions/02-route-segment-config:{dynamicParams.mdx,instant.mdx,maxDuration.mdx,preferredRegion.mdx,prefetch.mdx,runtime.mdx}|01-app/03-api-reference/03-file-conventions:{default.mdx,dynamic-routes.mdx,error.mdx,forbidden.mdx,instrumentation-client.mdx,instrumentation.mdx,intercepting-routes.mdx,layout.mdx,loading.mdx,mdx-components.mdx,middleware.mdx,not-found.mdx,page.mdx,parallel-routes.mdx,proxy.mdx,public-folder.mdx,route-groups.mdx,route.mdx,src-folder.mdx,template.mdx,unauthorized.mdx}|01-app/03-api-reference/04-functions:{after.mdx,cacheLife.mdx,cacheTag.mdx,catchError.mdx,connection.mdx,cookies.mdx,draft-mode.mdx,fetch.mdx,forbidden.mdx,generate-image-metadata.mdx,generate-metadata.mdx,generate-sitemaps.mdx,generate-static-params.mdx,generate-viewport.mdx,headers.mdx,image-response.mdx,io.mdx,next-request.mdx,next-response.mdx,next-root-params.mdx,not-found.mdx,permanentRedirect.mdx,redirect.mdx,refresh.mdx,revalidatePath.mdx,revalidateTag.mdx,unauthorized.mdx,unstable_cache.mdx,unstable_noStore.mdx,unstable_rethrow.mdx,updateTag.mdx,use-link-status.mdx,use-params.mdx,use-pathname.mdx,use-report-web-vitals.mdx,use-router.mdx,use-search-params.mdx,use-selected-layout-segment.mdx,use-selected-layout-segments.mdx,userAgent.mdx}|01-app/03-api-reference/05-config/01-next-config-js:{adapterPath.mdx,allowedDevOrigins.mdx,appDir.mdx,assetPrefix.mdx,authInterrupts.mdx,basePath.mdx,cacheComponents.mdx,cacheHandlers.mdx,cacheLife.mdx,compress.mdx,crossOrigin.mdx,cssChunking.mdx,deploymentId.mdx,devIndicators.mdx,distDir.mdx,env.mdx,expireTime.mdx,exportPathMap.mdx,generateBuildId.mdx,generateEtags.mdx,headers.mdx,htmlLimitedBots.mdx,httpAgentOptions.mdx,images.mdx,incrementalCacheHandlerPath.mdx,inlineCss.mdx,instrumentationClientInject.mdx,logging.mdx,mdxRs.mdx,onDemandEntries.mdx,optimizePackageImports.mdx,output.mdx,outputHashSalt.mdx,pageExtensions.mdx,partialPrefetching.mdx,poweredByHeader.mdx,prefetchInlining.mdx,productionBrowserSourceMaps.mdx,proxyClientMaxBodySize.mdx,reactCompiler.mdx,reactMaxHeadersLength.mdx,reactStrictMode.mdx,redirects.mdx,rewrites.mdx,sassOptions.mdx,serverActions.mdx,serverComponentsHmrCache.mdx,serverExternalPackages.mdx,staleTimes.mdx,staticGeneration.mdx,taint.mdx,trailingSlash.mdx,transpilePackages.mdx,turbopack.mdx,turbopackFileSystemCache.mdx,turbopackIgnoreIssue.mdx,turbopackLocalPostcssConfig.mdx,turbopackMemoryEviction.mdx,typedRoutes.mdx,typescript.mdx,urlImports.mdx,useLightningcss.mdx,viewTransition.mdx,webVitalsAttribution.mdx,webpack.mdx}|01-app/03-api-reference/05-config:{02-typescript.mdx,03-eslint.mdx}|01-app/03-api-reference/06-cli:{create-next-app.mdx,next.mdx}|01-app/03-api-reference/07-adapters:{01-configuration.mdx,02-creating-an-adapter.mdx,03-api-reference.mdx,04-testing-adapters.mdx,05-routing-with-next-routing.mdx,06-implementing-ppr-in-an-adapter.mdx,07-runtime-integration.mdx,08-invoking-entrypoints.mdx,09-output-types.mdx,10-routing-information.mdx,11-use-cases.mdx}|02-pages/01-getting-started:{01-installation.mdx,02-project-structure.mdx,04-images.mdx,05-fonts.mdx,06-css.mdx,11-deploying.mdx}|02-pages/02-guides:{analytics.mdx,authentication.mdx,babel.mdx,ci-build-caching.mdx,content-security-policy.mdx,css-in-js.mdx,custom-server.mdx,debugging.mdx,draft-mode.mdx,environment-variables.mdx,forms.mdx,incremental-static-regeneration.mdx,instrumentation.mdx,internationalization.mdx,lazy-loading.mdx,mdx.mdx,multi-zones.mdx,open-telemetry.mdx,package-bundling.mdx,post-css.mdx,preview-mode.mdx,production-checklist.mdx,redirecting.mdx,sass.mdx,scripts.mdx,self-hosting.mdx,static-exports.mdx,tailwind-v3-css.mdx,third-party-libraries.mdx}|02-pages/02-guides/migrating:{app-router-migration.mdx,from-create-react-app.mdx,from-vite.mdx}|02-pages/02-guides/testing:{cypress.mdx,jest.mdx,playwright.mdx,vitest.mdx}|02-pages/02-guides/upgrading:{codemods.mdx,version-10.mdx,version-11.mdx,version-12.mdx,version-13.mdx,version-14.mdx,version-9.mdx}|02-pages/03-building-your-application/01-routing:{01-pages-and-layouts.mdx,02-dynamic-routes.mdx,03-linking-and-navigating.mdx,05-custom-app.mdx,06-custom-document.mdx,07-api-routes.mdx,08-custom-error.mdx}|02-pages/03-building-your-application/02-rendering:{01-server-side-rendering.mdx,02-static-site-generation.mdx,04-automatic-static-optimization.mdx,05-client-side-rendering.mdx}|02-pages/03-building-your-application/03-data-fetching:{01-get-static-props.mdx,02-get-static-paths.mdx,03-get-server-side-props.mdx,05-client-side.mdx}|02-pages/03-building-your-application/06-configuring:{12-error-handling.mdx}|02-pages/04-api-reference:{06-edge.mdx,08-turbopack.mdx}|02-pages/04-api-reference/01-components:{font.mdx,form.mdx,head.mdx,image-legacy.mdx,image.mdx,link.mdx,script.mdx}|02-pages/04-api-reference/02-file-conventions:{instrumentation.mdx,proxy.mdx,public-folder.mdx,src-folder.mdx}|02-pages/04-api-reference/03-functions:{get-initial-props.mdx,get-server-side-props.mdx,get-static-paths.mdx,get-static-props.mdx,next-request.mdx,next-response.mdx,use-params.mdx,use-report-web-vitals.mdx,use-router.mdx,use-search-params.mdx,userAgent.mdx}|02-pages/04-api-reference/04-config/01-next-config-js:{adapterPath.mdx,allowedDevOrigins.mdx,assetPrefix.mdx,basePath.mdx,bundlePagesRouterDependencies.mdx,compress.mdx,crossOrigin.mdx,deploymentId.mdx,devIndicators.mdx,distDir.mdx,env.mdx,exportPathMap.mdx,generateBuildId.mdx,generateEtags.mdx,headers.mdx,httpAgentOptions.mdx,images.mdx,logging.mdx,onDemandEntries.mdx,optimizePackageImports.mdx,output.mdx,pageExtensions.mdx,poweredByHeader.mdx,productionBrowserSourceMaps.mdx,proxyClientMaxBodySize.mdx,reactStrictMode.mdx,redirects.mdx,rewrites.mdx,serverExternalPackages.mdx,trailingSlash.mdx,transpilePackages.mdx,turbopack.mdx,typescript.mdx,urlImports.mdx,useLightningcss.mdx,webVitalsAttribution.mdx,webpack.mdx}|02-pages/04-api-reference/04-config:{01-typescript.mdx,02-eslint.mdx}|02-pages/04-api-reference/05-cli:{create-next-app.mdx,next.mdx}|02-pages/04-api-reference/06-adapters:{01-configuration.mdx,02-creating-an-adapter.mdx,03-api-reference.mdx,04-testing-adapters.mdx,05-routing-with-next-routing.mdx,06-implementing-ppr-in-an-adapter.mdx,07-runtime-integration.mdx,08-invoking-entrypoints.mdx,09-output-types.mdx,10-routing-information.mdx,11-use-cases.mdx}|03-architecture:{accessibility.mdx,fast-refresh.mdx,nextjs-compiler.mdx,supported-browsers.mdx}|04-community:{01-contribution-guide.mdx,02-rspack.mdx}<!-- NEXT-AGENTS-MD-END -->
