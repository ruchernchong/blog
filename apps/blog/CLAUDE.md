# CLAUDE.md - Instructions for Claude Code

## Commands
- Build: `pnpm build`
- Dev server: `pnpm dev`
- Test: `pnpm test` (Vitest)
- Single test: `pnpm test -- utils/__tests__/truncate.test.ts`
- Lint: `pnpm lint`
- Type checking: `pnpm check-types`
- DB migrations: `pnpm migrate`

## Code Style Guidelines
- TypeScript with strict mode enabled
- Tailwind CSS for styling (v4)
- Next.js App Router structure
- Path aliases: `@/*` maps to project root
- Prettier with tailwindcss plugin
- Use named exports over default exports
- Components use PascalCase, utilities use camelCase
- Use TypeScript interfaces/types for props
- Prefer functional components with hooks
- Files organized by feature/domain
- Error handling with proper type checking
- MDX content managed via contentlayer