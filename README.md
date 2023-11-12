# Portfolio

Site: https://ruchern.xyz

- Framework: [Next.js](https://nextjs.org)
- Deployment: [AWS using SST](https://sst.dev)
- Styling: [Tailwind CSS](https://tailwindcss.com)
- Database: [Planetscale](https://planetscale.com)
- ORM: [Prisma](https://prisma.io)

## TODO

Portfolio site is now going into maintenance mode and will stop developing new features. Main goal is to clean up, optimise and prepare to migrate to use the `/app` directory.

- [ ] Tidy up the components
- [ ] Complete writing the remaining drafts that are scheduled

## Overview

- `lib/*` - Collection of utilities and helpers
- `pages/api` - [API Routes](https://nextjs.org/docs/api-routes/introduction)
- `pages/` - Static pages
- `pages/sitemap.xml.tsx` - Sitemap
- `pages/feed.xml.tsx` - RSS feed
- `public/` - Static assets such as fonts, images, and icons
- `styles/` - Basically global style from Tailwind CSS and Prism language highlighting

## Installation

```bash
# Cloning the repository
git clone https://github.com/ruchernchong/portfolio.git

# Change directory
cd portfolio

# Installing npm packages
bun install

# Run the development server
bun dev

# Setting environment variables
cp .env.local.example .env.local
```
