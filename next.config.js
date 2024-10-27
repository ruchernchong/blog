const { withContentlayer } = require("next-contentlayer");
const { withSentryConfig } = require("@sentry/nextjs");

// Define CSP header with more granular controls
const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' *.sentry.io;
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: *.sentry.io;
    font-src 'self' data:;
    connect-src 'self' sentry.io *.sentry.io;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    block-all-mixed-content;
    upgrade-insecure-requests;
`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // Disable X-Powered-By header
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
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=()", // Added interest-cohort
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin", // More restrictive referrer policy
          },
          // {
          //   key: "Content-Security-Policy",
          //   value: cspHeader.replace(/\n/g, ""),
          // },
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

// First apply ContentLayer configuration
const withContentLayerConfig = withContentlayer(nextConfig);

// Then apply Sentry configuration
const sentryConfig = {
  org: "ru-chern-chong",
  project: "portfolio",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: true,
  // Additional Sentry configurations
  beforeSend(event) {
    // Sanitize error events if needed
    return event;
  },
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
};

// Export the final configuration with both ContentLayer and Sentry
module.exports = withSentryConfig(withContentLayerConfig, sentryConfig);
