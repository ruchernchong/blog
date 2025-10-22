# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Root-level Commands (run from project root)

#### Development
- `pnpm dev` - Start development server with hot reload (uses Turbo)
- `pnpm build` - Build all apps for production (uses Turbo)
- `pnpm start` - Start production server (uses Turbo)
- `pnpm test` - Run tests across all apps (uses Turbo)
- `pnpm lint` - Run linting across all apps (uses Turbo)
- `pnpm lint:blog` - Run linting for blog app specifically

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

This is a Turborepo monorepo containing a Next.js 15 portfolio website with an integrated blog system.

### Monorepo Structure
- **Root**: Turborepo configuration with shared tooling (Biome, commitlint, semantic-release)
- **apps/blog**: Main Next.js application with blog functionality and integrated CMS at `/studio`

### Tech Stack
- **Framework**: Next.js 15 with App Router and React 19
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