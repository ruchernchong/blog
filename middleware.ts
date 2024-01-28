import { NextRequest, NextResponse } from "next/server";

export const middleware = (request: NextRequest) => {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const cspHeader = `
    default-src 'self' analytics.google.com;
    script-src 'self' 'unsafe-inline' 'unsafe-eval' *.googletagmanager.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    block-all-mixed-content;
    upgrade-insecure-requests;
`;

  const contentSecurityPolicyHeaderValue = cspHeader
    .replace(/\s{2,}/g, " ")
    .trim();

  const securityHeaders = [
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
    {
      key: "Content-Security-Policy",
      value: contentSecurityPolicyHeaderValue,
    },
  ];

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  securityHeaders.forEach(({ key, value }) => {
    requestHeaders.set(key, value);
  });

  const response = NextResponse.next({
    headers: requestHeaders,
  });

  response.headers.set(
    "Content-Security-Policy",
    contentSecurityPolicyHeaderValue
  );

  return response;
};
