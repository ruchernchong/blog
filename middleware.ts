import { NextRequest, NextResponse } from "next/server";
import { DOMAIN_NAME } from "@/config";

export const middleware = (request: NextRequest) => {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  // Define allowed origins including Vercel deployment URLs
  const VERCEL_URL = process.env.VERCEL_URL;
  const allowedOrigins = [
    `https://${DOMAIN_NAME}`,
    ...(VERCEL_URL ? [`https://${VERCEL_URL}`] : []),
    process.env.NODE_ENV === "development" ? "http://localhost:3000" : "",
  ].filter(Boolean);

  const origin = request.headers.get("origin");

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' *.${DOMAIN_NAME} *.vercel-scripts.com *.googletagmanager.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspHeader);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Set security headers
  response.headers.set("Content-Security-Policy", cspHeader);

  // Set CORS headers only if origin is in allowed list
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET,HEAD,POST,OPTIONS",
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "X-Requested-With,Content-Type,Authorization",
    );
  }

  // Additional security headers
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );

  return response;
};

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
