export interface NavLink {
  title: string;
  href: string;
}

export const DOMAIN_NAME = "ruchern.dev";
export const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || `https://${DOMAIN_NAME}`;

export const navLinks: NavLink[] = [
  // { title: "Blog", href: "/blog" },
  { title: "About", href: "/about" },
  { title: "Notes", href: "/notes" },
  { title: "Projects", href: "/projects" },
  // { title: "Resume", href: "/resume" },
];
