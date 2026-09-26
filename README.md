# ruchern.dev

A personal portfolio and blog built with Next.js 16, React 19, and TypeScript.

## Quick Start

```bash
pnpm install         # Install dependencies
pnpm dev             # Start dev server
pnpm test            # Run tests
pnpm build           # Build for production
```

## Tech Stack

### Core Stack
- **Framework**: Next.js 16.3 with App Router and React 19.2
- **Language**: TypeScript 7 (strict mode)
- **Styling**: Tailwind CSS v4 (PostCSS-only config)
- **UI Components**: HeroUI v3 (Pro + OSS) with HugeIcons
- **Animation**: Motion, React Spring, View Transitions API

### Backend & Data
- **Database**: Neon PostgreSQL with Drizzle ORM
- **Cache**: Upstash Redis for analytics and stats
- **Storage**: Cloudflare R2 for media assets
- **Auth**: Better Auth with OAuth (GitHub, Google)

### Content & Editor
- **Content**: Database-backed MDX with next-mdx-remote
- **CMS**: Built-in Content Studio at /studio
- **Rich Text**: MDXEditor for content authoring

### Development & Quality
- **Monorepo**: pnpm workspaces with Turborepo
- **Testing**: Vitest (Browser Mode with Playwright) and vitest-browser-react
- **Linting**: Biome for code quality and formatting
- **Unused code**: Knip for unused files, exports, and dependencies
- **Git Hooks**: Husky with Commitlint and lint-staged
- **CI/CD**: GitHub Actions with semantic-release

### Utilities
- **Icons**: HugeIcons
- **Date Handling**: date-fns
- **Query State**: nuqs for type-safe URL params
- **3D Graphics**: Cobe for globe visualizations

## Key Features

### Content Management
- **Built-in CMS**: Content Studio for blog and media management
- **MDX Support**: Rich content with React components
- **Media Library**: Cloudflare R2-backed asset management
- **Draft System**: Save posts before publishing
- **Series Support**: Organise posts into series with navigation

### Analytics & Stats
- **Analytics**: PostHog and Vercel Analytics
- **Dashboard**: PostHog-backed visitor analytics (Query API) at /dashboard
- **AI Usage**: Public /usage page for my coding agents at API-equivalent list prices: generated summary, activity heatmap, period comparison, model and agent share over time, model character, cost vs volume, cache and effort, per-model profiles, and a filterable Explorer
- **Post Statistics**: Client-side views tracking (likes temporarily disabled)
- **Popular Posts**: Top posts by view count
- **Related Posts**: Tag-based recommendations with Jaccard similarity

### Performance & SEO
- **Image Optimization**: Automatic image optimization
- **OpenGraph Images**: Dynamic OG image generation
- **RSS Feed**: Auto-generated feed at /feed.xml
- **LLM Crawlers**: /llms.txt endpoint for AI indexing
- **Structured Data**: JSON-LD for rich search results

### Developer Experience
- **Type Safety**: Strict TypeScript with typed routes
- **Hot Reload**: Turbopack with file system cache
- **Automated Release**: Semantic versioning with CI/CD
- **Git Hooks**: Pre-commit linting and conventional commits

## Development

### Prerequisites
- PNPM 10.22.0 or later
- Node.js 18+ (for compatibility)
- PostgreSQL database (Neon recommended)
- Redis instance (Upstash recommended)

### Setup
1. Clone the repository
2. Install dependencies: `pnpm install`
3. Copy `apps/web/.env.example` to `apps/web/.env` and configure
4. Run database migrations: `pnpm db:migrate`
5. (Optional) Seed database: `pnpm db:seed`
6. Start dev server: `pnpm dev`

### Available Commands
See [AGENTS.md](./AGENTS.md) for complete command reference including:
- Development, testing, and build commands
- Database management (migrations, studio, seeding)
- Code quality tools (linting, formatting, type checking)
- Custom slash commands for coding agents

### Usage collector (macOS)

The `agent-usage` CLI, a Rust binary, parses local Claude, Codex, OpenCode, Cursor, and Grok logs and POSTs daily
rows to `https://ruchern.dev/api/usage/ingest`. Auth is OAuth (admin account),
not `BLOG_MCP_AUTH_TOKEN`. 15-minute LaunchAgent optional.

Install the prebuilt universal binary from the latest release
(no checkout or Rust toolchain needed), or build from a checkout with
`bash apps/cli/macos/install.sh` (needs Rust). Details:
[apps/cli/macos/INSTALL.md](./apps/cli/macos/INSTALL.md)

```zsh
curl -fsSL https://github.com/ruchernchong/blog/releases/latest/download/install.sh | bash
~/.local/bin/agent-usage auth login   # admin account
~/.local/bin/agent-usage-run         # POST if there are rows; then check /usage
```

`agent-usage update` installs the latest release in place. `agent-usage --help`
lists the commands (`measure`, `ingest`, `auth`, `update`, `completions`).

## Contributing

### Commit Conventions
This project uses [Conventional Commits](https://conventionalcommits.org/):
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Test updates
- `chore:` - Tooling and configuration

Commits are validated via Commitlint with a 72 character header limit.

### Code Quality
- Pre-commit hooks run linting and formatting via Husky
- All commits must pass Biome checks
- `pnpm knip` must stay clean (unused files, exports, and dependencies)
- TypeScript strict mode is enforced
- Tests should maintain coverage levels

### Release Process
Automated via semantic-release on push to `main` branch:
1. CI runs tests, linting, and builds
2. Semantic version is determined from commit messages
3. Changelog is auto-generated
4. GitHub release is created with git tag

## Documentation

See [AGENTS.md](./AGENTS.md) for comprehensive documentation including:

- Available commands
- Architecture overview
- Environment variables
- Code conventions
