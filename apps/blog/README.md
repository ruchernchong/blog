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
- **Neon PostgreSQL** - Serverless Postgres database
- **Drizzle ORM** - Type-safe database toolkit
- **Upstash Redis** - Serverless Redis for caching
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

If you've configured OAuth providers, you can access the Content Studio at `http://localhost:3000/studio` to manage blog posts through the web interface.

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
│       │   │   ├── api/        # API routes (studio, auth)
│       │   │   ├── feed.xml/   # RSS feed route handler
│       │   │   └── llms.txt/   # LLM SEO route handler
│       │   ├── components/     # Reusable React components
│       │   ├── lib/           # Utility functions and integrations
│       │   │   ├── queries/   # Pure database queries (Drizzle)
│       │   │   └── services/  # Business logic & caching
│       │   ├── schema/        # Drizzle database schema
│       │   │   ├── posts.ts   # Blog posts table
│       │   │   ├── sessions.ts # Analytics sessions
│       │   │   └── auth.ts    # Better Auth tables
│       │   └── utils/         # Helper functions with tests
│       ├── migrations/        # Database migration files
│       └── drizzle.config.ts  # Drizzle configuration
├── packages/                  # Shared packages (currently empty)
└── turbo.json                # Turborepo configuration
```

## 🎯 Key Features

- **📝 Blog System**: MDX-powered blog with syntax highlighting
- **✏️ Content Studio**: Web-based CMS at `/studio` for managing blog posts
- **🔥 Popular Posts**: Real-time view tracking with Redis sorted sets, showing top posts by popularity
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
- **🚀 Modern Stack**: Latest Next.js 16, React 19.2, and TypeScript features

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
