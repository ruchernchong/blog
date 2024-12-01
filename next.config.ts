import type { NextConfig } from "next";
import { withContentlayer } from "next-contentlayer2";
import { DOMAIN_NAME } from "@/config";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    const VERCEL_URL = process.env.VERCEL_URL;
    const allowedOrigins = [
      `https://${DOMAIN_NAME}`,
      ...(VERCEL_URL ? [`https://${VERCEL_URL}`] : []),
      process.env.NODE_ENV === "development" ? "http://localhost:3000" : "",
    ].filter(Boolean);

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
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Access-Control-Allow-Origin",
            value: allowedOrigins.join(","),
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,HEAD,POST,OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "X-Requested-With,Content-Type,Authorization",
          },
          {
            key: "Access-Control-Allow-Credentials",
            value: "true",
          },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: allowedOrigins.join(","),
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,HEAD,POST,PUT,DELETE,OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "X-Requested-With,Content-Type,Authorization",
          },
          {
            key: "Access-Control-Allow-Credentials",
            value: "true",
          },
        ],
      },
    ];
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default withContentlayer(nextConfig);
