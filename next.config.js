const { withContentlayer } = require("next-contentlayer");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

module.exports = withContentlayer(nextConfig);
