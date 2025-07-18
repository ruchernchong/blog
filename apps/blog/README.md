# Personal Portfolio

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fruchernchong%2Fportfolio)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Welcome to my portfolio website! Visit the live site at [ruchern.dev](https://ruchern.dev)

## 🚀 Tech Stack

This portfolio is built with modern web technologies:

### Core Framework

- **Next.js 15** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe JavaScript with strict mode

### Styling & UI

- **Tailwind CSS v4** - Utility-first CSS framework
- **Tailwind Typography** - Beautiful typographic defaults
- **Lucide React** - Beautiful & consistent icons
- **Class Variance Authority** - Component variants

### Content & Data

- **Contentlayer2** - Content SDK for MDX processing
- **MDX** - Markdown with JSX components
- **Neon PostgreSQL** - Serverless Postgres database
- **Drizzle ORM** - Type-safe database toolkit
- **Upstash Redis** - Serverless Redis for caching

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

- **Node.js 18.x or higher** - JavaScript runtime
- **pnpm** - Fast, disk space efficient package manager
- **Git** - Version control system

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
cp .env.example .env
```

5. Update the `.env` file with your configuration (see [Environment Variables](#-environment-variables) section)

6. Set up the database

```bash
pnpm migrate
```

7. Start the development server

```bash
pnpm dev
```

Your site should now be running at `http://localhost:3000`!

## 🧪 Development Workflow

### Available Scripts

```bash
# Development
pnpm dev              # Start development server with hot reload (uses Turbo)
pnpm build            # Build all apps for production (uses Turbo)
pnpm test             # Run tests across all apps (uses Turbo)
pnpm lint             # Run linting across all apps (uses Turbo)

# App-specific (from /apps/blog/)
pnpm dev              # Start blog dev server (contentlayer2 dev & next dev --turbopack)
pnpm build            # Build blog app for production
pnpm test             # Run Vitest tests with coverage
pnpm check-types      # TypeScript type checking
pnpm migrate          # Run database migrations
pnpm vercel-build     # Production build with migrations

# Quality & Release
pnpm release          # Create semantic release (runs build, test, lint, check-types)
pnpm release:blog     # Release blog app specifically
```

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
│   └── blog/              # Main Next.js application
│       ├── app/           # Next.js App Router pages and API routes
│       ├── components/    # Reusable React components
│       ├── content/       # MDX blog posts
│       ├── db/           # Database schema and setup
│       ├── lib/          # Utility functions and integrations
│       ├── migrations/   # Database migration files
│       └── utils/        # Helper functions with tests
├── packages/             # Shared packages (currently empty)
└── turbo.json           # Turborepo configuration
```

## 🎯 Key Features

- **📝 Blog System**: MDX-powered blog with syntax highlighting
- **📊 Analytics Dashboard**: Custom privacy-focused visitor analytics
- **🎨 Dark/Light Mode**: Tailwind CSS theming support
- **📱 Responsive Design**: Mobile-first responsive layout
- **🔍 SEO Optimized**: Structured data, sitemaps, and meta tags
- **⚡ Performance**: Optimized images, caching, and core web vitals
- **🔒 Privacy-First**: IP hashing and minimal data collection
- **🚀 Modern Stack**: Latest Next.js, React, and TypeScript features

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
