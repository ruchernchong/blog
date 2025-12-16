# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Root-level Commands (run from project root)

#### Development

- `pnpm dev` - Start development server with hot reload (uses Turbo, runs Next.js + Convex dev in parallel)
- `pnpm build` - Build all apps for production (uses Turbo)
- `pnpm start` - Start production server (uses Turbo)
- `pnpm test` - Run tests across all apps (uses Turbo)
- `pnpm lint` - Run linting across all apps with Biome (uses Turbo)
- `pnpm lint:blog` - Run linting for blog app with Biome

#### Database Management

- `pnpm db:drop` - Drop database (interactive, requires confirmation)
- `pnpm db:generate` - Generate database migrations from schema
- `pnpm db:migrate` - Run database migrations
- `pnpm db:push` - Push schema changes to database
- `pnpm db:pull` - Pull schema from database
- `pnpm db:check` - Check migration files for issues
- `pnpm db:up` - Apply pending migrations
- `pnpm db:studio` - Open Drizzle Studio for database management
- `pnpm db:seed` - Seed database with test data

#### Quality & Release

- `pnpm release` - Create semantic release (runs build, test, lint, check-types)
- `pnpm release:blog` - Release blog app specifically

### App-specific Commands (run from `/apps/blog/`)

#### Development

- `pnpm dev` - Start blog dev server (next dev --turbopack)
- `pnpm build` - Build blog app for production
- `pnpm start` - Start production server
- `pnpm test` - Run Vitest tests with coverage
- `pnpm test -- utils/__tests__/truncate.test.ts` - Run single test file
- `pnpm test:coverage` - Generate coverage report
- `pnpm check-types` - TypeScript type checking
- `pnpm vercel-build` - Production build with migrations (for Vercel)

#### Database (App-level)

- `pnpm drop` - Drop database tables
- `pnpm generate` - Generate migrations from schema
- `pnpm migrate` - Run database migrations
- `pnpm push` - Push schema changes directly
- `pnpm pull` - Pull schema from database
- `pnpm check` - Check migration files
- `pnpm up` - Apply migrations
- `pnpm studio` - Open Drizzle Studio
- `pnpm seed` - Seed database with development data

#### Convex (App-level)

- `pnpm convex:dev` - Start Convex development server (automatically runs with `pnpm dev` at root)
- `pnpm convex:deploy` - Deploy Convex functions to production

## Architecture Overview

This is a Turborepo monorepo containing a Next.js 16 portfolio website with an integrated blog system.

### Monorepo Structure

- **Root**: Turborepo configuration with shared tooling (Biome, commitlint, semantic-release)
- **apps/blog**: Main Next.js application with blog functionality and integrated CMS at `/studio`

### Tech Stack

- **Framework**: Next.js 16 with App Router and React 19.2
- **Content**: Database-backed MDX with next-mdx-remote for compilation
- **Database**: Neon PostgreSQL with Drizzle ORM
- **Real-time**: Convex for live likes, views, and reactions
- **Authentication**: Better Auth with OAuth providers (GitHub, Google)
- **Cache**: Upstash Redis for related posts and analytics
- **Styling**: Tailwind CSS v4
- **Testing**: Vitest with React Testing Library
- **Code Quality**: Biome for linting/formatting, TypeScript strict mode
- **Deployment**: Vercel with automated migrations

### Key Features

- **Custom Analytics**: Privacy-focused visitor tracking with IP hashing
- **Blog System**: Database-backed MDX blog posts with automatic metadata generation (reading time, SEO metadata)
- **Real-time Reactions**: Live likes and views powered by Convex with per-user tracking
- **Popular Posts**: Real-time view tracking displaying top posts by popularity (Convex-powered)
- **Related Posts**: Tag-based recommendations using Jaccard similarity algorithm with Redis caching
- **Content Studio**: Built-in CMS at `/studio` for managing blog posts directly in the database
- **LLM SEO**: Dynamic `/llms.txt` endpoint for LLM crawlers (following llmstxt.org standard)
- **RSS Feed**: Dynamic `/feed.xml` endpoint with latest published posts
- **Performance**: Optimized images, caching, and core web vitals tracking
- **SEO**: Structured data, sitemaps, OpenGraph image generation

### Database Architecture

#### PostgreSQL (Neon + Drizzle ORM)
- Schema in `apps/blog/src/schema/` using Drizzle ORM
    - `posts.ts`: Blog posts with MDX content, metadata, tags, and publish status
    - `sessions.ts`: Session tracking for analytics (visits, geolocation, device info)
    - `auth.ts`: Better Auth authentication tables (users, accounts, sessions, verification)
    - `index.ts`: Database client export
- Configuration in `apps/blog/drizzle.config.ts`
- Migrations in `apps/blog/migrations/` managed by drizzle-kit

#### Convex (Real-time Database)
- Schema in `apps/blog/convex/schema.ts`
    - `likes`: Per-user like tracking (slug, userHash, count) with compound indexes
    - `viewCounts`: Post view aggregation (slug, count) with slug index
- Functions in `apps/blog/convex/`
    - `likes.ts`: Like queries and mutations (get, getByUser, increment)
    - `views.ts`: View queries and mutations (get, getTop, increment, remove)
- Configuration in `apps/blog/convex.json`

### Analytics System

- Real-time visitor statistics (browsers, countries, devices, OS, pages, referrers)
- Data visualization with Recharts components in `/analytics` dashboard
- Privacy protection through IP address hashing

### Layered Architecture

The codebase follows a clean 3-layer architecture pattern for maintainability and testability:

#### 1. Database Layer (`lib/queries/`)
**Pure database access with Drizzle ORM**
- Contains only database queries with no business logic
- Type-safe queries using Drizzle's query builder
- Examples: `getPostBySlug()`, `getPublishedPostsBySlugs()`, `getPostsWithOverlappingTags()`
- No Redis, no calculations, no external dependencies
- Easy to test and maintain

#### 2. Service Layer (`lib/services/`)
**Business logic and data orchestration with class-based architecture**

The service layer uses classes for better testability, dependency injection, and error handling:

**Core Services:**
- `CacheService` - Redis wrapper with error handling and graceful degradation
  - Wraps all Redis operations (get, set, del, zadd, zrange, zrem)
  - Returns null/defaults on failures instead of crashing
  - Logs errors with ERROR_IDS for monitoring
  - Health check method for Redis availability

- `RelatedPostsCalculator` - Tag-based post recommendations
  - Implements Jaccard similarity algorithm for tag matching
  - Caches results for 24 hours to reduce computation
  - Filters posts below minimum similarity threshold (0.1)
  - Returns posts sorted by similarity score

- `CacheInvalidationService` - Cache management on mutations
  - Invalidates related post caches when tags change
  - Invalidates all posts with overlapping tags
  - Integrated into studio API handlers

**Service Container** (`lib/services/index.ts`):
- Exports singleton instances of all services
- Provides dependency injection for testing
- Centralizes service initialization

**Configuration** (`lib/config/cache.config.ts`):
- Centralized cache configuration (TTLs, limits, Redis keys)
- Related posts: limit 4, TTL 24 hours, min similarity 0.1
- Redis keys: `post:{slug}:related` for related posts cache

**Benefits:**
- Error resilience: Redis failures don't crash the app
- Testability: Dependency injection enables easy mocking
- Maintainability: Clear class boundaries and responsibilities
- Type safety: Full TypeScript support with proper types
- Observability: Structured error logging for monitoring

#### 3. Action Layer (`app/(blog)/_actions/`)
**Server actions for mutations only**
- Contains only write operations (no reads)
- Uses React Server Actions for client-side mutations
- Never used for data fetching (use services or Convex queries directly in components)
- Note: Likes and views are now handled by Convex mutations (not server actions)

**Architecture Benefits**:
- Clear separation of concerns
- Easy to unit test each layer independently
- Reusable queries across multiple services
- Business logic isolated from data access
- Follows Next.js 15+ best practices (server actions for writes only)

### Convex Integration

The application uses Convex for real-time features:

**Client Components** - Use Convex React hooks
- `useQuery(api.likes.get, { slug })` - Subscribe to real-time like counts
- `useQuery(api.views.get, { slug })` - Subscribe to real-time view counts
- `useMutation(api.likes.increment)` - Increment like count (max 50 per user)
- `useMutation(api.views.increment)` - Increment view count

**Server Components** - Use Convex server queries
- `fetchQuery(api.views.getTop, { limit })` - Get popular posts by view count
- Import from `convex/nextjs` for server-side data fetching

**User Identification**
- Authenticated users: Better Auth user ID
- Anonymous users: Hashed IP address (SHA-256 with salt)
- Same pattern as analytics for privacy protection

**Development Workflow**
- `pnpm dev` at root automatically runs both Next.js and Convex dev servers in parallel
- Convex schema changes require restart or `--accept-data-loss` flag
- Schema validation happens on function execution

## Environment Variables

Required environment variables (see `apps/blog/.env.example`):

### Core Configuration

- `NEXT_PUBLIC_BASE_URL` - Base URL for the application (e.g., http://localhost:3000)

### Database

- `DATABASE_URL` - Neon PostgreSQL connection string

### Convex

- `NEXT_PUBLIC_CONVEX_URL` - Convex deployment URL (get from `npx convex dev` or Convex dashboard)

### GitHub Integration

- `GH_ACCESS_TOKEN` - GitHub personal access token for API access

### Redis (Upstash)

- `UPSTASH_REDIS_REST_URL` - Upstash Redis REST URL
- `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis REST token

### Analytics

- `IP_SALT` - Salt for IP address hashing (privacy protection)

### Authentication (Better Auth)

- `BETTER_AUTH_SECRET` - Secret key for Better Auth
- `BETTER_AUTH_URL` - Base URL for auth callbacks (e.g., http://localhost:3000)

### OAuth Providers

- `GITHUB_CLIENT_ID` - GitHub OAuth app client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth app client secret
- `GOOGLE_CLIENT_ID` - Google OAuth app client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth app client secret

## Documentation & Learning Resources

### Using Context7 for Library Documentation

When working with libraries in this project, use the Context7 MCP server to retrieve up-to-date documentation and code
examples. This is especially important for rapidly evolving libraries.

**Priority Libraries for Context7**:

- **Next.js** (`/vercel/next.js`) - Framework APIs, routing, data fetching
- **React** (`/facebook/react`) - Hooks, components, server components
- **Convex** (`/get-convex/convex-js`) - Real-time queries, mutations, schema, React hooks
- **Drizzle ORM** (`/drizzle-team/drizzle-orm`) - Database queries, schema, migrations
- **Better Auth** (`/better-auth/better-auth`) - Authentication setup, providers, session management
- **Tailwind CSS** (`/tailwindlabs/tailwindcss`) - Styling utilities, configuration
- **tRPC** (`/trpc/trpc`) - API routes, client setup, type safety
- **Vitest** (`/vitest-dev/vitest`) - Testing patterns, assertions, mocking
- **next-mdx-remote** (`/hashicorp/next-mdx-remote`) - MDX compilation, components
- **Recharts** (`/recharts/recharts`) - Chart components, data visualization

**When to Use Context7**:

1. Before implementing new features using these libraries
2. When encountering API changes or deprecation warnings
3. For troubleshooting library-specific issues
4. When learning best practices for library usage
5. Before upgrading library versions

**How to Use**:

```
Claude, using Context7, how do I implement [feature] with [library]?
```

Example queries:

- "Using Context7, show me how to set up OAuth providers in Better Auth"
- "Using Context7, what's the best way to handle dynamic routes in Next.js 16?"
- "Using Context7, how do I create a custom middleware with tRPC?"

## Code Conventions

### Language & Writing Style

**Use English (Singapore) for all content, documentation, and user-facing text**:

- **Spelling**: British English variants (e.g., "colour", "optimise", "centre", "analyse")
- **Date Format**: DD/MM/YYYY or DD Month YYYY (e.g., 24/10/2025 or 24 October 2025)
- **Time Format**: 24-hour format (e.g., 14:30 instead of 2:30 PM)
- **Currency**: Singapore Dollar (SGD) when applicable
- **Tone**: Professional yet approachable, clear and concise
- **Terminology**: Use Singapore English terms where appropriate (e.g., "lorry" instead of "truck", "flat" instead of "
  apartment" for HDB context)

**Examples**:

```tsx
// ✅ Correct - English (Singapore)
const message = "Your profile has been optimised for better performance";
const date = "24 October 2025";
const time = "14:30";

// ❌ Incorrect - American English
const message = "Your profile has been optimized for better performance";
const date = "October 24, 2025";
const time = "2:30 PM";
```

### File Structure

- TypeScript with strict mode and path aliases (`@/*` maps to app root)
- Use kebab-case for filenames
- Tests in `__tests__/` directories alongside components
- Named exports preferred over default exports

### Styling & Components

- Tailwind CSS v4 with utility-first approach
- Component variants using class-variance-authority
- Functional components with hooks
- Error handling with proper TypeScript types

### Content Management

All blog content is managed through the database-backed Content Studio:

- **Content Studio CMS**: Access at `/studio` route (isolated route group with own layout)
- **Database Storage**: All blog posts stored in Neon PostgreSQL
- **Posts Schema**: `src/schema/posts.ts` - MDX content, metadata, tags, publish status
- **MDX Compilation**: Uses `next-mdx-remote` with rehype/remark plugins for rendering
- **Automatic Metadata**: Reading time, SEO tags, OpenGraph images generated automatically
- **API Routes**: `/api/studio/posts` for CRUD operations
- **Management UI**: Post listing, creation, editing, and publishing workflows
- **Draft Support**: Posts can be saved as drafts before publishing

### Authentication System

- Better Auth configuration in `src/lib/auth.ts`
- OAuth providers: GitHub and Google
- Account linking enabled for trusted providers
- Protected routes using `(auth)` route group
- Login page at `/login` with OAuth buttons
- Session management and last login method tracking

## Tailwind CSS Guidelines

### Spacing Standards

#### 1. **Primary Rule: Use gap-* Instead of Space Utilities**

- **Always use `flex gap-*` for spacing** between child elements
- Use only even numbers: `gap-2, gap-4, gap-6, gap-8, gap-10, gap-12`
- **Avoid**: `gap-1, gap-3, gap-5, gap-7` and fractions like `gap-1.5`
- **Never use `space-y-*` or `space-x-*`** in custom components

```tsx
// ❌ Never - space utilities in custom code
<div className="space-y-4">
  <div>Content 1</div>
  <div>Content 2</div>
</div>

// ✅ Always - gap utilities
<div className="flex flex-col gap-4">
  <div>Content 1</div>
  <div>Content 2</div>
</div>
```

#### 2. **Margin Rules**

- **Avoid margin-top** for layout spacing
- **Prefer margin-bottom** for creating separation between elements
- **Use margin-y** sparingly for vertical rhythm
- **Use margin-x** for horizontal adjustments

```tsx
// ❌ Before - margin-top for spacing
<div className="mt-6">
  <h2>Title</h2>
</div>

// ✅ After - margin-bottom on previous element
<div>Previous content</div>
<div className="mb-6">
  <h2>Title</h2>
</div>
```

#### 3. **Spacing Priority Order**

1. **`gap*`** - For container element spacing (highest priority)
2. **`margin-bottom`** - For element separation
3. **`margin-y`** - For symmetrical vertical spacing
4. **`margin-top`** - Only for specific UI adjustments

#### 4. **Spacing Scale Reference**

Even numbers only for consistent spacing:

- `gap-2`/`mb-2` = 0.5rem (8px) - Small gaps
- `gap-4`/`mb-4` = 1rem (16px) - Standard gaps
- `gap-6`/`mb-6` = 1.5rem (24px) - Medium gaps
- `gap-8`/`mb-8` = 2rem (32px) - Large gaps
- `gap-12`/`mb-12` = 3rem (48px) - Extra large gaps

#### 5. **Component Architecture**

- Use `cn()` utility for conditional class merging
- Class Variance Authority (CVA) for component variants
- Consistent prop interfaces with `className?: string`
- Atomic component composition

```tsx
import { cn } from "@/lib/utils";

interface ComponentProps {
  className?: string;
}

export const Component = ({ className, ...props }: ComponentProps) => (
  <div className={cn("base-classes", className)} {...props} />
);
```

#### 6. **Theming System**

- Use semantic color tokens: `foreground`, `muted`, `accent`, `border`, `background`
- Dark mode via `.dark` class on parent elements
- CSS custom properties for design tokens
- OKLCH color space for modern color control

```tsx
// ✅ Semantic colors
<div className="bg-background text-foreground border-border">
  <h2 className="text-primary">Title</h2>
  <p className="text-muted-foreground">Description</p>
</div>
```

#### 7. **Exception Cases**

- `mt-px` allowed for checkbox/radio alignment
- Negative margins for specific layout corrections
- Fractional values in UI components for fine-tuning
- **Do not modify files in `apps/blog/src/components/ui/`** (shadcn/ui components)
