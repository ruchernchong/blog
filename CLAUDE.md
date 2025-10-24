# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Root-level Commands (run from project root)

#### Development
- `pnpm dev` - Start development server with hot reload (uses Turbo)
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

## Architecture Overview

This is a Turborepo monorepo containing a Next.js 16 portfolio website with an integrated blog system.

### Monorepo Structure
- **Root**: Turborepo configuration with shared tooling (Biome, commitlint, semantic-release)
- **apps/blog**: Main Next.js application with blog functionality and integrated CMS at `/studio`

### Tech Stack
- **Framework**: Next.js 16 with App Router and React 19.2
- **Content**: Database-backed MDX with next-mdx-remote for compilation
- **Database**: Neon PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth with OAuth providers (GitHub, Google)
- **Cache**: Upstash Redis for analytics and caching
- **Styling**: Tailwind CSS v4
- **Testing**: Vitest with React Testing Library
- **Code Quality**: Biome for linting/formatting, TypeScript strict mode
- **Deployment**: Vercel with automated migrations

### Key Features
- **Custom Analytics**: Privacy-focused visitor tracking with IP hashing
- **Blog System**: Database-backed MDX blog posts with automatic metadata generation (reading time, SEO metadata)
- **Content Studio**: Built-in CMS at `/studio` for managing blog posts directly in the database
- **LLM SEO**: Dynamic `/llms.txt` endpoint for LLM crawlers (following llmstxt.org standard)
- **RSS Feed**: Dynamic `/feed.xml` endpoint with latest published posts
- **Performance**: Optimized images, caching, and core web vitals tracking
- **SEO**: Structured data, sitemaps, OpenGraph image generation

### Database Architecture
- Schema in `apps/blog/src/schema/` using Drizzle ORM
  - `posts.ts`: Blog posts with MDX content, metadata, tags, and publish status
  - `sessions.ts`: Session tracking for analytics (visits, geolocation, device info)
  - `auth.ts`: Better Auth authentication tables (users, accounts, sessions, verification)
  - `index.ts`: Database client export
- Configuration in `apps/blog/drizzle.config.ts`
- Migrations in `apps/blog/migrations/` managed by drizzle-kit

### Analytics System
- Real-time visitor statistics (browsers, countries, devices, OS, pages, referrers)
- Data visualization with Recharts components in `/analytics` dashboard
- Privacy protection through IP address hashing

## Environment Variables

Required environment variables (see `apps/blog/.env.example`):

### Core Configuration
- `NEXT_PUBLIC_BASE_URL` - Base URL for the application (e.g., http://localhost:3000)

### Database
- `DATABASE_URL` - Neon PostgreSQL connection string

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

## Code Conventions

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