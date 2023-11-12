# Portfolio

Site: https://ruchern.xyz

- Framework: [Next.js](https://nextjs.org)
- Deployment: [AWS using SST](https://sst.dev)
- Styling: [Tailwind CSS](https://tailwindcss.com)
- Database: [Planetscale](https://planetscale.com)
- ORM: [Prisma](https://prisma.io)

## TODO

Portfolio site is now going into maintenance mode and will stop developing new features. Main goal is to clean up, optimise and prepare to migrate to use the `/app` directory.

- [ ] Complete writing the remaining drafts that are scheduled

## Running locally

Node.js v18.8 and above is required.

```bash
# Cloning the repository
git clone https://github.com/ruchernchong/portfolio.git

# Change directory
cd portfolio

# Installing npm packages
pnpm install

# Run the development server
pnpm dev
```

### Setting environment variables

Create a `.env` file or equivalent manually or use the follow command to quickly help you to do so

```bash
cp .env.example .env
```
