import type { Route } from "next";

import "dotenv/config";

export interface NavLink {
  title: string;
  href: Route;
}

export const DOMAIN_NAME =
  process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
export const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ?? `https://${DOMAIN_NAME}`;

export const SITE_NAME = "Ru Chern";
export const SITE_DESCRIPTION =
  "Frontend Developer from Singapore. Interested in automating workflows and building in React, Node, and Typescript.";

export const navLinks: NavLink[] = [
  { title: "Blog", href: "/blog" },
  { title: "Dashboard", href: "/dashboard" },
  { title: "About", href: "/about" },
  { title: "Projects", href: "/projects" },
];

export const MAX_LIKES_PER_USER = 50;
