# Personal Portfolio

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fruchernchong%2Fportfolio)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Welcome to my portfolio website! Visit the live site at [ruchern.dev](https://ruchern.dev)

## 🚀 Tech Stack

This portfolio is built with modern web technologies:

### Core Framework

- **Next.js 16** - React framework with App Router
- **React 19.2** - Latest React with concurrent features
- **TypeScript** - Type-safe JavaScript with strict mode

### Styling & UI

- **Tailwind CSS v4** - Utility-first CSS framework
- **Tailwind Typography** - Beautiful typographic defaults
- **Lucide React** - Beautiful & consistent icons
- **Class Variance Authority** - Component variants

### Content & Data

- **Database-backed MDX** - next-mdx-remote for MDX compilation
- **MDX** - Markdown with JSX components
- **MDXEditor** - Rich text editing in Content Studio
- **Neon PostgreSQL** - Serverless Postgres database
- **Drizzle ORM** - Type-safe database toolkit
- **Cloudflare R2** - Object storage for media assets
- **Upstash Redis** - Serverless Redis for related posts, analytics, and post statistics
- **Better Auth** - Authentication with OAuth providers (GitHub, Google)

### Analytics & Monitoring

- **Custom Analytics** - Privacy-focused visitor tracking
- **Vercel Analytics** - Web vitals and performance
- **Vercel Speed Insights** - Real user monitoring

### Development & Testing

- **Vitest** - Fast unit testing framework
- **Testing Library** - React component testing
- **Biome** - Fast linting and formatting
- **TypeScript** - Strict mode type checking
- **Husky** - Git hooks

### Deployment & Infrastructure

- **Vercel** - Deployment platform (Singapore region)
- **GitHub Actions** - CI/CD workflows

## 🛠️ Getting Started

### Prerequisites

- **Node.js 18.x or higher** - JavaScript runtime (tested with v22.20.0)
- **pnpm 10.2.0 or higher** - Fast, disk space efficient package manager
- **Git** - Version control system
- **Neon PostgreSQL database** - Serverless database (sign up at [neon.tech](https://neon.tech))
- **Cloudflare R2** - Object storage for media (create bucket at [cloudflare.com](https://cloudflare.com))
- **Upstash Redis** - Serverless Redis (sign up at [upstash.com](https://upstash.com))
- **GitHub/Google OAuth apps** - For authentication (optional, for `/studio` CMS access)

### Installation

1. Clone the repository

```bash
git clone https://github.com/ruchernchong/portfolio.git
```

2. Navigate to the project directory

```bash
cd portfolio
```

3. Install dependencies

```bash
pnpm install
```

4. Set up environment variables

```bash
cd apps/blog
cp .env.example .env
```

5. Update the `.env` file with your configuration:
   - `DATABASE_URL` - Your Neon PostgreSQL connection string
   - `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` - From Upstash
   - `GH_ACCESS_TOKEN` - GitHub personal access token
   - `IP_SALT` - Random string for IP hashing
   - Cloudflare R2 credentials:
     - `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID
     - `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` - R2 API tokens
     - `R2_BUCKET_NAME` - Your R2 bucket name
     - `R2_PUBLIC_URL` - Public URL for R2 assets
   - OAuth credentials (optional, for `/studio` CMS):
     - `BETTER_AUTH_SECRET` - Random secret string
     - `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`
     - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

6. Return to project root and set up the database

```bash
cd ../..
pnpm db:migrate
```

7. (Optional) Seed the database with sample data

```bash
pnpm db:seed
```

8. Start the development server

```bash
pnpm dev
```

Your site should now be running at `http://localhost:3000`!

### Accessing the CMS

If you've configured OAuth providers, you can access the Content Studio at `http://localhost:3000/studio` to manage blog posts and media assets through the web interface:

- `/studio/posts` - Create, edit, and publish blog posts with MDXEditor
- `/studio/media` - Upload and manage media files with Cloudflare R2 storage

## 🧪 Development Workflow

### Available Scripts

#### Development (run from project root)
```bash
pnpm dev              # Start development server with hot reload
pnpm build            # Build all apps for production
pnpm start            # Start production server
pnpm test             # Run tests across all apps
pnpm lint             # Run linting across all apps
```

#### Database Management (run from project root)
```bash
pnpm db:generate      # Generate migrations from schema
pnpm db:migrate       # Run database migrations
pnpm db:push          # Push schema changes to database
pnpm db:studio        # Open Drizzle Studio for database management
pnpm db:seed          # Seed database with test data
```

#### Quality & Release
```bash
pnpm release          # Create semantic release (runs build, test, lint, check-types)
pnpm release:blog     # Release blog app specifically
```

For more commands, see the [CLAUDE.md](CLAUDE.md) file.

### Testing Strategy

- **Unit Tests**: Components and utilities with Vitest
- **Coverage Reports**: Generated in `coverage/` directory
- **Test Location**: Tests located in `__tests__/` directories alongside components

### Code Style

- **TypeScript**: Strict mode enabled with path aliases (`@/*`)
- **File Naming**: kebab-case for filenames
- **Components**: Functional components with hooks
- **Exports**: Named exports preferred over default exports


## 📁 Project Structure

This is a Turborepo monorepo with the following structure:

```
portfolio/
├── apps/
│   └── blog/                    # Main Next.js application
│       ├── src/
│       │   ├── app/            # Next.js App Router pages and API routes
│       │   │   ├── (auth)/     # Authentication routes (login)
│       │   │   ├── (blog)/     # Main blog routes
│       │   │   │   └── _actions/ # Server actions (mutations only)
│       │   │   ├── (studio)/   # CMS routes at /studio
│       │   │   │   ├── posts/  # Blog post management
│       │   │   │   └── media/  # Media library
│       │   │   ├── api/        # API routes (studio, auth)
│       │   │   │   └── studio/ # Studio API endpoints
│       │   │   │       ├── posts/ # Post CRUD operations
│       │   │   │       └── media/ # Media upload & management
│       │   │   ├── feed.xml/   # RSS feed route handler
│       │   │   └── llms.txt/   # LLM SEO route handler
│       │   ├── components/     # Reusable React components
│       │   ├── lib/           # Utility functions and integrations
│       │   │   ├── api/       # API route utilities
│       │   │   │   ├── types.ts # ApiResult<T> type
│       │   │   │   ├── auth.ts # requireAuth() utility
│       │   │   │   ├── validation.ts # JSON parsing & Zod validation
│       │   │   │   ├── params.ts # Route parameter validation
│       │   │   │   └── errors.ts # Standardized error responses
│       │   │   ├── queries/   # Pure database queries (Drizzle)
│       │   │   └── services/  # Business logic & caching
│       │   │       ├── cache.service.ts # Redis operations
│       │   │       ├── post-stats.service.ts # Likes & views
│       │   │       ├── popular-posts.service.ts # Top posts
│       │   │       ├── related-posts.service.ts # Recommendations
│       │   │       ├── r2.service.ts # Cloudflare R2 storage
│       │   │       └── media.service.ts # Media management
│       │   ├── schema/        # Drizzle database schema
│       │   │   ├── posts.ts   # Blog posts table
│       │   │   ├── sessions.ts # Analytics sessions
│       │   │   ├── media.ts   # Media assets table
│       │   │   └── auth.ts    # Better Auth tables
│       │   └── utils/         # Helper functions with tests
│       ├── migrations/        # Database migration files
│       └── drizzle.config.ts  # Drizzle configuration
├── packages/                  # Shared packages (currently empty)
└── turbo.json                # Turborepo configuration
```

## 🏗️ Architecture

### Service Layer Design

This application follows a **class-based service architecture** for better testability, maintainability, and error resilience:

#### Core Services (`lib/services/`)

**`CacheService`** - Redis Operations Wrapper
- Wraps all Redis operations with error handling
- Returns null/defaults on failures (graceful degradation)
- Logs errors with structured ERROR_IDS for monitoring
- Provides health check for Redis availability
- Methods: `get`, `set`, `del`, `zadd`, `zrange`, `zrem`, `isHealthy`

**`PostStatsService`** - Post Statistics Management
- Handles per-post like and view counts
- Stores data in Redis with atomic operations
- Supports per-user tracking and limits
- Provides increment/decrement operations

**`PopularPostsService`** - Popular Posts Ranking
- Maintains sorted set of posts by view count
- Provides top N popular posts queries
- Integrates with post statistics for real-time updates
- Redis-based for fast retrieval

**`RelatedPostsCalculator`** - Smart Recommendations
- Implements **Jaccard similarity algorithm** for tag matching
- Formula: `J(A,B) = |A ∩ B| / |A ∪ B|` (intersection over union)
- Caches results for 24 hours to reduce computation
- Filters posts below minimum similarity threshold (0.1)
- Returns posts sorted by similarity score (0.0 to 1.0)

**`CacheInvalidationService`** - Cache Management
- Invalidates related post caches when tags change
- Invalidates all posts with overlapping tags
- Integrated into studio API PATCH/DELETE handlers

**`R2Service`** - Cloudflare R2 Storage
- Generates presigned upload URLs for direct client uploads
- Handles object deletion from R2 buckets
- Configures S3-compatible client for R2 endpoints
- Supports secure, scalable media storage

**`MediaService`** - Media Asset Management
- Coordinates uploads between database and R2 storage
- Provides CRUD operations for media records
- Supports soft deletes and metadata updates
- Integrates search and pagination for media library

#### Configuration Files

**Cache Configuration** (`lib/config/cache.config.ts`):
```typescript
RELATED_POSTS: { LIMIT: 4, TTL: 86400, MIN_SIMILARITY: 0.1 }
REDIS_KEYS: {
  RELATED_CACHE: (slug) => `post:${slug}:related`
}
```

**R2 Configuration** (`lib/config/r2.config.ts`):
- S3-compatible client configuration
- Cloudflare R2 endpoint setup
- Bucket and region settings

#### Architecture Benefits

- **Error Resilience**: Redis and R2 failures don't crash the app
- **Testability**: Comprehensive unit tests with dependency injection
- **Maintainability**: Clear class boundaries and single responsibilities
- **Type Safety**: Full TypeScript support with proper interfaces
- **Observability**: Structured error logging for monitoring
- **Performance**: Request-level caching and fallback strategies
- **Scalability**: Cloudflare R2 for distributed media storage

### Layered Architecture

The codebase follows a **4-layer architecture** for separation of concerns:

1. **Database Layer** (`lib/queries/`) - Pure Drizzle ORM queries, no business logic
2. **Service Layer** (`lib/services/`) - Business logic, caching, data transformations
3. **API Utilities Layer** (`lib/api/`) - Reusable utilities for type-safe API route handlers
4. **Action Layer** (`app/(blog)/_actions/`) - Server actions for mutations only

**API Utilities** provide standardized patterns for:
- Authentication with `requireAuth()` (Better Auth integration)
- Request validation with Zod schemas (`parseAndValidateBody()`)
- Route parameter validation (`validateRouteParam()`)
- Consistent error responses (404, 409, 500, 503)
- Type-safe error handling with `ApiResult<T>`

## 🎯 Key Features

- **📝 Blog System**: MDX-powered blog with syntax highlighting
- **✏️ Content Studio**: Web-based CMS at `/studio` for managing blog posts and media
- **🖼️ Media Library**: Cloudflare R2-backed media management with image optimization, metadata editing, and soft deletes
- **✨ Rich Text Editing**: MDXEditor integration for enhanced content authoring experience
- **❤️ Post Statistics**: Redis-powered likes and views tracking with per-user counting
- **🔥 Popular Posts**: View tracking displaying top posts by popularity (Redis-powered)
- **🔗 Related Posts**: Smart tag-based recommendations using Jaccard similarity algorithm with Redis caching
- **🔐 Authentication**: OAuth login with GitHub and Google via Better Auth
- **📊 Analytics Dashboard**: Custom privacy-focused visitor analytics
- **🤖 LLM SEO**: Dynamic `/llms.txt` endpoint for AI crawler discovery (llmstxt.org standard)
- **📡 RSS Feed**: Auto-generated `/feed.xml` with latest posts
- **🎨 Dark/Light Mode**: Tailwind CSS theming support
- **📱 Responsive Design**: Mobile-first responsive layout
- **🔍 SEO Optimized**: Structured data, sitemaps, and meta tags
- **⚡ Performance**: Optimized images, caching, and core web vitals
- **🔒 Privacy-First**: IP hashing and minimal data collection
- **🚀 Modern Stack**: Latest Next.js 16, React 19.2, TypeScript, and Cloudflare R2

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📫 Contact

[@ruchernchong](https://twitter.com/ruchernchong)

Project Link: [https://github.com/ruchernchong/portfolio](https://github.com/ruchernchong/portfolio)
