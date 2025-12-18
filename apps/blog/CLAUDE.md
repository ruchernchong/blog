# CLAUDE.md

This file provides guidance for the blog application. For comprehensive project documentation, see the root-level [CLAUDE.md](../../CLAUDE.md).

## App-Specific Commands (run from `/apps/blog/`)

### Development

- `bun run dev` - Start blog dev server (next dev --turbopack)
- `bun run build` - Build blog app for production
- `bun run start` - Start production server
- `bun run test` - Run Vitest tests with coverage
- `bun run test -- utils/__tests__/truncate.test.ts` - Run single test file
- `bun run test:coverage` - Generate coverage report
- `bun run typecheck` - TypeScript type checking
- `bun run vercel-build` - Production build with migrations (for Vercel)

### Database (App-level)

- `bun run drop` - Drop database tables
- `bun run generate` - Generate migrations from schema
- `bun run migrate` - Run database migrations
- `bun run push` - Push schema changes directly
- `bun run pull` - Pull schema from database
- `bun run check` - Check migration files
- `bun run up` - Apply migrations
- `bun run studio` - Open Drizzle Studio
- `bun run seed` - Seed database with development data

## Quick Reference

For complete documentation including:
- Architecture overview
- Tech stack details
- Environment variables
- Code conventions
- Tailwind CSS guidelines
- Layered architecture pattern

Please refer to the root-level [CLAUDE.md](../../CLAUDE.md) file.