# Personal Portfolio

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fruchernchong%2Fportfolio)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Welcome to my portfolio website! Visit the live site at [ruchern.dev](https://ruchern.dev)

## 🚀 Tech Stack

This portfolio is built with modern web technologies:

- **Framework**: [Next.js](https://nextjs.org) - React framework for production
- **Styling**: [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
- **Database**: [Neon](https://neon.tech) - Serverless Postgres database
- **Deployment**: [Vercel](https://vercel.com) - Platform for frontend frameworks and static sites

## 🛠️ Getting Started

### Prerequisites

- Node.js 18.x or higher
- [pnpm](https://pnpm.io) package manager

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

5. Update the `.env` file with your own values

```env
# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

6. Start the development server

```bash
pnpm dev
```

Your site should now be running at `http://localhost:3000`!

## 🔧 Configuration

### Environment Variables

The following environment variables are required to run the application:

| Variable                   | Description                                                                                                                                | Required |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| `UPSTASH_REDIS_REST_URL`   | The REST API endpoint URL for your Upstash Redis database. Found in your Upstash Redis console under "REST API" details.                   | Yes      |
| `UPSTASH_REDIS_REST_TOKEN` | Authentication token for accessing your Upstash Redis database via REST API. Found in your Upstash Redis console under "REST API" details. | Yes      |

## 📝 Project Structure

```
portfolio/
├── app/              # Next.js app directory
├── components/       # React components
├── lib/             # Utility functions
└── public/          # Static assets
```

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

Your Name - [@ruchernchong](https://twitter.com/ruchernchong)

Project Link: [https://github.com/ruchernchong/portfolio](https://github.com/ruchernchong/portfolio)
