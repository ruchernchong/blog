# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

- `bun run dev` - Start development server with hot reload (uses Turbo)
- `bun run build` - Build all apps for production (uses Turbo)
- `bun run test` - Run tests across all apps (uses Turbo)
- `bun run lint` - Run linting across all apps (uses Turbo)

### App-specific commands (run from `/apps/blog/`)

- `bun run dev` - Start blog dev server (next dev)
- `bun run build` - Build blog app for production
- `bun run test` - Run Vitest tests with coverage
- `bun run test -- utils/__tests__/truncate.test.ts` - Run single test file
- `bun run test:coverage` - Generate coverage report
- `bun run typecheck` - TypeScript type checking
- `bun run migrate` - Run database migrations
- `bun run vercel-build` - Production build with migrations

### Quality & Release

- `bun run release` - Create semantic release (runs build, test, lint, check-types)
- `bun run release:blog` - Release blog app specifically

## Architecture Overview

This is a Turborepo monorepo containing a Next.js 15 portfolio website with an integrated blog system.

### Monorepo Structure

- **Root**: Turborepo configuration with shared tooling (Biome, commitlint, semantic-release)
- **apps/blog**: Main Next.js application with blog functionality
- **packages/**: Currently empty but structured for shared packages

### Tech Stack

- **Framework**: Next.js 15 with App Router and React 19
- **Content**: Database-backed MDX with next-mdx-remote for compilation
- **Database**: Neon PostgreSQL with Drizzle ORM
- **Cache**: Upstash Redis for analytics and caching
- **Styling**: Tailwind CSS v4
- **Testing**: Vitest with React Testing Library
- **Code Quality**: Biome for linting/formatting, TypeScript strict mode
- **Deployment**: Vercel with automated migrations

### Key Features

- **Custom Analytics**: Privacy-focused visitor tracking with IP hashing
- **Blog System**: MDX-powered posts with computed fields (reading time, SEO metadata)
- **Performance**: Optimized images, caching, and core web vitals tracking
- **SEO**: Structured data, sitemaps, OpenGraph image generation

### Database Architecture

- Schema in `apps/blog/db/schema.ts` using Drizzle ORM
- Session tracking table for analytics (visits, geolocation, device info)
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

All blog content is managed through the database-backed Content Studio:

- **Content Studio CMS**: Access at `/studio` route (isolated route group with own layout)
- **Database Storage**: All blog posts stored in Neon PostgreSQL
- **Posts Schema**: `src/schema/posts.ts` - MDX content, metadata, tags, publish status
- **MDX Compilation**: Uses `next-mdx-remote` with rehype/remark plugins for rendering
- **Automatic Metadata**: Reading time, SEO tags, OpenGraph images generated automatically
- **API Routes**: `/api/studio/posts` for CRUD operations
- **Management UI**: Post listing, creation, editing, and publishing workflows
- **Draft Support**: Posts can be saved as drafts before publishing