# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `pnpm dev` - Start development server with hot reload (uses Turbo)
- `pnpm build` - Build all apps for production (uses Turbo)
- `pnpm test` - Run tests across all apps (uses Turbo)
- `pnpm lint` - Run linting across all apps (uses Turbo)

### App-specific commands (run from `/apps/blog/`)
- `pnpm dev` - Start blog dev server (contentlayer2 dev & next dev --turbopack)
- `pnpm build` - Build blog app for production
- `pnpm test` - Run Vitest tests with coverage
- `pnpm test -- utils/__tests__/truncate.test.ts` - Run single test file
- `pnpm test:coverage` - Generate coverage report
- `pnpm check-types` - TypeScript type checking
- `pnpm migrate` - Run database migrations
- `pnpm vercel-build` - Production build with migrations

### Quality & Release
- `pnpm release` - Create semantic release (runs build, test, lint, check-types)
- `pnpm release:blog` - Release blog app specifically

## Architecture Overview

This is a Turborepo monorepo containing a Next.js 15 portfolio website with an integrated blog system.

### Monorepo Structure
- **Root**: Turborepo configuration with shared tooling (Biome, commitlint, semantic-release)
- **apps/blog**: Main Next.js application with blog functionality and integrated CMS at `/studio`

### Tech Stack
- **Framework**: Next.js 15 with App Router and React 19
- **Content**: Contentlayer2 for MDX blog processing
- **Database**: Neon PostgreSQL with Drizzle ORM
- **Cache**: Upstash Redis for analytics and caching
- **Styling**: Tailwind CSS v4
- **Testing**: Vitest with React Testing Library
- **Code Quality**: Biome for linting/formatting, TypeScript strict mode
- **Deployment**: Vercel with automated migrations

### Key Features
- **Custom Analytics**: Privacy-focused visitor tracking with IP hashing
- **Blog System**: MDX-powered posts with computed fields (reading time, SEO metadata)
- **Content Studio**: Built-in CMS at `/studio` for managing blog posts directly in the database
- **Performance**: Optimized images, caching, and core web vitals tracking
- **SEO**: Structured data, sitemaps, OpenGraph image generation

### Database Architecture
- Schema in `apps/blog/src/db/schema.ts` using Drizzle ORM
  - Posts table: Blog posts with MDX content, metadata, tags, and publish status
- Database client in `apps/blog/src/db/index.ts`
- Migrations in `apps/blog/migrations/` managed by drizzle-kit

### Analytics System
- Real-time visitor statistics (browsers, countries, devices, OS, pages, referrers)
- Data visualization with Recharts components in `/analytics` dashboard
- Privacy protection through IP address hashing

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

#### File-based (Contentlayer2)
- Legacy MDX files in `apps/blog/content/blog/`
- Contentlayer2 processes MDX with automatic slug generation
- Support for draft posts via `isDraft` field

#### Database-based (Content Studio)
- Access CMS at `/studio` route (isolated route group with own layout)
- CRUD operations for blog posts stored in Neon PostgreSQL
- Posts table in `src/db/schema.ts` with MDX content, metadata, tags, and publish status
- Automatic metadata generation (reading time, SEO tags, OpenGraph)
- API routes at `/api/studio/posts` for post management
- Simple UI with post listing, creation, and editing forms
- Uses `(studio)` route group for complete layout separation from blog