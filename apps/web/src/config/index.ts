import type { Route } from "next";
import packageJson from "../../package.json";

import "dotenv/config";

export const VERSION = packageJson.version;

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
  { title: "blog", href: "/blog" },
  { title: "dashboard", href: "/dashboard" },
  { title: "usage", href: "/usage" },
  { title: "about", href: "/about" },
  { title: "projects", href: "/projects" },
];

export const MAX_LIKES_PER_USER = 50;
