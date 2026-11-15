import type { NextConfig } from "next";
import { withWorkflow } from "workflow/next";
import { ACCEPTS_MARKDOWN_PATTERN } from "./src/lib/accepts-markdown";

/** Matches a request whose `Accept` header lists `text/markdown` (agents). */
const ACCEPTS_MARKDOWN = [
  { type: "header" as const, key: "accept", value: ACCEPTS_MARKDOWN_PATTERN },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  reactCompiler: true,
  cacheComponents: true,
  partialPrefetching: true,
  transpilePackages: ["@workspace/mcp", "@workspace/usage"],
  images: {
    qualities: [75, 100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "models.dev",
        pathname: "/logos/**",
      },
      {
        protocol: "https",
        hostname: "*.r2.dev",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "assets.ruchern.dev",
        pathname: "/**",
      },
      // Project preview (Open Graph) images on the landing page
      {
        protocol: "https",
        hostname: "motormetrics.app",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "isleapyear.app",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "opengraph.githubassets.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "repository-images.githubusercontent.com",
        pathname: "/**",
      },
    ],
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
    browserToTerminal: "warn",
  },
  serverExternalPackages: ["next-mdx-remote", "@mdx-js/mdx"],
  skipTrailingSlashRedirect: true,
  typedRoutes: true,
  experimental: {
    mcpServer: true,
    turbopackRustReactCompiler: true,
    typedEnv: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        // The homepage as Markdown, ahead of the prerendered HTML page.
        { source: "/", has: ACCEPTS_MARKDOWN, destination: "/index.md" },
      ],
      afterFiles: [
        {
          source: "/ingest/static/:path*",
          destination: "https://eu-assets.i.posthog.com/static/:path*",
        },
        {
          source: "/ingest/array/:path*",
          destination: "https://eu-assets.i.posthog.com/array/:path*",
        },
        {
          source: "/ingest/:path*",
          destination: "https://eu.i.posthog.com/:path*",
        },
      ],
      fallback: [
        // Only paths no route matched get here: a Markdown 404 in place of
        // the HTML one.
        {
          source: "/:path*",
          has: ACCEPTS_MARKDOWN,
          destination: "/not-found.md",
        },
      ],
    };
  },
};

// Enables the `"use workflow"` / `"use step"` directives (see src/workflows).
export default withWorkflow(nextConfig);
