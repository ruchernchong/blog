# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- Build: `pnpm build`
- Dev server: `pnpm dev` (runs contentlayer2 dev & next dev --turbo)
- Test: `pnpm test` (Vitest with coverage)
- Single test: `pnpm test -- utils/__tests__/truncate.test.ts`
- Test with coverage: `pnpm test:coverage`
- Lint: `pnpm lint`
- Type checking: `pnpm check-types`
- DB migrations: `pnpm migrate`
- Production build: `pnpm vercel-build` (runs migrate then build)

## Architecture Overview

This is a Next.js 15 blog application with the following key architectural components:

### Core Stack

- Next.js App Router with React 19
- TypeScript with strict mode
- Tailwind CSS v4 for styling
- Contentlayer2 for MDX blog content processing
- Neon PostgreSQL database with Drizzle ORM
- Upstash Redis for caching and analytics
- Vercel for deployment

### Database Architecture

- Primary database: Neon PostgreSQL
- Schema defined in `db/schema.ts` using Drizzle ORM
- Session tracking table for analytics (visits, geolocation, device info)
- Migrations managed via `drizzle-kit` in `migrations/` directory

### Content Management

- Blog posts stored as MDX files in `content/blog/`
- Contentlayer2 processes MDX with computed fields (reading time, slugs, SEO metadata)
- Automatic generation of OpenGraph images, structured data, and canonical URLs
- Support for draft posts via `isDraft` field

### Analytics System

- Custom analytics implementation using session tracking
- Real-time visitor statistics (browsers, countries, devices, OS, pages, referrers)
- Data visualization with Recharts components
- IP address hashing for privacy protection

### Key Directories

- `app/` - Next.js App Router pages and API routes
- `components/` - Reusable React components with tests in `__tests__/`
- `lib/` - Utility functions (GitHub API, hashing, user agent parsing)
- `config/` - Application configuration and Redis setup
- `data/` - Static data (companies, projects, socials)
- `utils/` - Helper functions with unit tests

## Code Style Guidelines

- TypeScript with strict mode enabled
- Tailwind CSS for styling (v4)
- Next.js App Router structure
- Path aliases: `@/*` maps to project root
- Prettier with tailwindcss plugin
- Use named exports over default exports
- Use kebab-case for filenames whenever possible
- Use TypeScript interfaces/types for props
- Prefer functional components with hooks
- Files organized by feature/domain
- Error handling with proper type checking
- MDX content managed via contentlayer2

## Testing

- Vitest for unit testing with jsdom environment
- Testing Library for React component testing
- Coverage reports generated in `coverage/` directory
- Test files located in `__tests__/` directories alongside components 