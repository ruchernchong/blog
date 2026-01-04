# Blog

A personal portfolio and blog built with Next.js 16, React 19, and TypeScript.

## Quick Start

```bash
bun install          # Install dependencies
bun run dev          # Start dev server
bun run test         # Run tests
bun run build        # Build for production
```

## Tech Stack

### Core Stack
- **Framework**: Next.js 16.1 with App Router and React 19.2
- **Language**: TypeScript 5.2 (strict mode)
- **Styling**: Tailwind CSS v4 (PostCSS-only config)
- **UI Components**: shadcn/ui built on Base UI with HugeIcons
- **Animation**: Motion, Framer Motion, View Transitions API

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
- **Testing**: Vitest with React Testing Library
- **Linting**: Biome for code quality and formatting
- **Git Hooks**: Husky with Commitlint and lint-staged
- **CI/CD**: GitHub Actions with semantic-release

### Utilities
- **Icons**: HugeIcons (primary), Simple Icons (brand)
- **Date Handling**: date-fns
- **Query State**: nuqs for type-safe URL params
- **3D Graphics**: Cobe for globe visualizations

## Key Features

### Content Management
- **Built-in CMS**: Content Studio for blog and media management
- **MDX Support**: Rich content with React components
- **Media Library**: Cloudflare R2-backed asset management
- **Draft System**: Save posts before publishing

### Analytics & Stats
- **Custom Analytics**: Privacy-focused visitor tracking with IP hashing
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
- Bun 1.3.5 or later
- Node.js 18+ (for compatibility)
- PostgreSQL database (Neon recommended)
- Redis instance (Upstash recommended)

### Setup
1. Clone the repository
2. Install dependencies: `bun install`
3. Copy `.env.example` to `.env` and configure
4. Run database migrations: `bun run db:migrate`
5. (Optional) Seed database: `bun run db:seed`
6. Start dev server: `bun run dev`

### Available Commands
See [CLAUDE.md](./CLAUDE.md) for complete command reference including:
- Development, testing, and build commands
- Database management (migrations, studio, seeding)
- Code quality tools (linting, formatting, type checking)
- Custom slash commands for Claude Code

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
- TypeScript strict mode is enforced
- Tests should maintain coverage levels

### Release Process
Automated via semantic-release on push to `main` branch:
1. CI runs tests, linting, and builds
2. Semantic version is determined from commit messages
3. Changelog is auto-generated
4. GitHub release is created with git tag

## Documentation

See [CLAUDE.md](./CLAUDE.md) for comprehensive documentation including:

- Available commands
- Architecture overview
- Environment variables
- Code conventions
