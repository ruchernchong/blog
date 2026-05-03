# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run linting with Biome
- `pnpm format` - Format code with Biome
- `pnpm typecheck` - TypeScript type checking

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
- `pnpm test:coverage` - Generate coverage report
- `pnpm test <path>` - Run a specific test file (e.g.,
  `pnpm test src/lib/services/__tests__/cache.service.test.ts`)

### Release

- `pnpm release` - Create semantic release

### MCP Server

- `pnpm mcp` - Start MCP server for blog management

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

## Architecture Overview

A Next.js 16 portfolio website with an integrated blog system and Content Studio CMS.

### Tech Stack

- **Framework**: Next.js 16.1 with App Router and React 19.2
- **Content**: Database-backed MDX with next-mdx-remote
- **Database**: Neon PostgreSQL with Drizzle ORM
- **Storage**: Cloudflare R2 for media assets
- **Authentication**: Better Auth with OAuth (GitHub, Google)
- **Cache**: Upstash Redis for related posts, analytics, and post statistics
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
- **Analytics**: Umami-backed dashboard with PostHog and Vercel Analytics running in parallel during the PostHog warm-up period
- **LLM SEO**: Dynamic `/llms.txt` endpoint for LLM crawlers
- **RSS Feed**: Dynamic `/feed.xml` endpoint

### Temporary Changes

- **Likes Feature Disabled**: The likes functionality is currently commented out to enable static generation of blog post pages. The code is preserved in comments for potential future re-enablement. Views are now tracked client-side using React 19's `useEffectEvent`.

### Project Structure

```
src/
├── app/              # Next.js App Router
│   ├── (main)/       # Public routes (blog, about, projects, dashboard)
│   ├── studio/       # CMS routes (protected)
│   ├── api/          # API routes
│   └── login/        # Auth pages
├── components/
│   ├── auth/         # Authentication components
│   ├── studio/       # CMS-specific components
│   └── ui/           # shadcn/ui primitives (DO NOT MODIFY)
├── lib/
│   ├── api/          # API route utilities (auth, validation, errors)
│   ├── config/       # Configuration constants
│   ├── queries/      # Pure database queries (Drizzle ORM)
│   ├── services/     # Business logic layer
│   └── og/           # OpenGraph image generation
├── mcp/              # MCP server for blog management
│   ├── index.ts      # Entry point with stdio transport
│   ├── server.ts     # McpServer configuration
│   └── tools/        # Tool implementations (posts, media)
├── server/           # tRPC routers (github, analytics)
├── schema/           # Drizzle ORM database schemas
├── utils/            # Pure utility functions (hash, truncate, etc.)
├── data/             # Static data (projects, work experience)
└── constants/        # Error IDs and app constants
```

### Layered Architecture

1. **Database Layer** (`lib/queries/`) - Pure Drizzle ORM queries
2. **Service Layer** (`lib/services/`) - Business logic with class-based services
3. **API Utilities** (`lib/api/`) - Standardised route handlers
4. **tRPC Layer** (`server/`) - Type-safe API procedures for GitHub and analytics
5. **Actions** (`app/_actions/`) - Server actions for mutations only

### Database

- **PostgreSQL**: Schema in `src/schema/` (posts, sessions, media, auth)
- **Redis**: Post stats, popular posts, related posts cache, analytics

## Environment Variables

See `.env.example` for all required variables:

- `NEXT_PUBLIC_BASE_URL` - Base URL for the application (e.g., https://ruchern.dev)
- `DATABASE_URL` - Neon PostgreSQL connection string
- `UPSTASH_REDIS_REST_URL/TOKEN` - Redis connection
- `BETTER_AUTH_SECRET/URL` - Authentication
- `GITHUB_CLIENT_ID/SECRET` - GitHub OAuth
- `GOOGLE_CLIENT_ID/SECRET` - Google OAuth
- `GH_ACCESS_TOKEN` - GitHub API access token for repository data
- `IP_SALT` - Salt for hashing IP addresses (privacy protection)
- `UMAMI_API_URL` - Umami analytics API endpoint
- `UMAMI_API_TOKEN` - Umami API authentication token
- `UMAMI_WEBSITE_ID` - Umami website identifier
- `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` - PostHog project token from the Vercel integration
- `NEXT_PUBLIC_POSTHOG_HOST` - PostHog ingest host from the Vercel integration, using EU Cloud
- `CLOUDFLARE_ACCOUNT_ID` - R2 storage
- `R2_ACCESS_KEY_ID/SECRET_ACCESS_KEY/BUCKET_NAME/PUBLIC_URL` - R2 config
- `BLOG_MCP_AUTH_TOKEN` - Bearer token for remote MCP access

## Code Conventions

### Language

**Use English (Singapore)** for all content:

- British English spelling (e.g., "colour", "optimise", "centre")
- Date format: DD/MM/YYYY or DD Month YYYY
- Time format: 24-hour (e.g., 14:30)

### File Structure

- TypeScript strict mode with path aliases (`@/*`)
- kebab-case for filenames
- Tests in `__tests__/` directories
- Named exports preferred

### Testing

- Use `it("should...")` convention for test descriptions
- Mock external dependencies (database, cache, APIs)
- Test behaviour, not implementation details

### Components

- **Do not modify `src/components/ui/`** - use composition instead
- Use `cn()` utility for conditional class merging
- Use class-variance-authority (CVA) for variants
- Follow component-naming skill conventions

### Tailwind CSS v4

- CSS-based configuration in `src/app/globals.css`
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
- **blog-voice** - Personal writing voice for blog posts on ruchern.dev (Singapore English, structural patterns, anti-patterns)

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
