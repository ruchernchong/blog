# Repository Guidelines

## Project Structure & Module Organization
- Monorepo managed with Turbo and pnpm.
- App: `apps/blog` (Next.js 15 + TypeScript). Key paths: `src/app`, `src/components`, `src/lib`, `src/db`, `src/utils`, `content/` (MDX), `migrations/`, `public/`.
- Tests live beside code in `src/**/__tests__` with `*.test.ts(x)` files.
- Shared packages: `packages/` (currently minimal, add here when extracting shared code).

## Build, Test, and Development Commands
- Root (runs via Turbo across workspaces):
  - `pnpm dev`: Start all dev tasks.
  - `pnpm build`: Build all apps.
  - `pnpm test`: Run all tests.
  - `pnpm lint`: Lint/format checks.
  - `pnpm release`: Orchestrated release pipeline.
- App-specific (from `apps/blog`):
  - `pnpm dev`: `contentlayer2 dev` + `next dev --turbopack`.
  - `pnpm build` / `pnpm start`: Production build/run.
  - `pnpm test` or `pnpm test:coverage`: Vitest (JSDOM) with coverage output in `coverage/`.
  - `pnpm check-types`: TypeScript no‑emit type check.
  - `pnpm migrate`: Run Drizzle migrations.

## Coding Style & Naming Conventions
- TypeScript strict; path alias `@/*` to `apps/blog/src/*`.
- Formatting/Linting: Biome at repo root; Next/ESLint in app; Tailwind class ordering via Prettier plugin.
- Indentation: spaces; JS quote style: double (Biome).
- Filenames: kebab-case; React components: PascalCase; prefer named exports.

## Testing Guidelines
- Frameworks: Vitest + Testing Library (JSDOM env).
- Location: `src/**/__tests__/*.test.ts(x)`.
- Quick runs: `pnpm -C apps/blog test`; coverage: `pnpm -C apps/blog test:coverage`.
- Add tests with scenarios and minimal mocks; keep fast and deterministic.

## Commit & Pull Request Guidelines
- Conventional Commits enforced by commitlint/husky.
  - Types: feat, fix, docs, style, refactor, perf, test, chore, ci, build, revert.
  - Scopes: blog, deps, ci, docs, release.
  - Format: `type(scope): subject` (lower‑case subject, no period).
  - Example: `feat(blog): add view counter`.
- PRs: clear description, link issues, include tests, screenshots for UI, update docs; pass CI (build, lint, test, type-check).

## Security & Configuration Tips
- Copy `.env.example` to `.env` and set required keys (e.g., `DATABASE_URL`, `SITE_URL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `GH_ACCESS_TOKEN`).
- Never commit secrets; prefer local `.env` and Vercel/GitHub secrets.
- After env changes affecting DB, run `pnpm -C apps/blog migrate` before `pnpm build` or `pnpm vercel-build`.

