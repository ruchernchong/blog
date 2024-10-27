export interface NavLink {
  title: string;
  href: string;
}

export const BASE_URL: string =
  process.env.NEXT_PUBLIC_BASE_URL || "https://ruchern.dev";

export const navLinks: NavLink[] = [
  // { title: "Blog", href: "/blog" },
  { title: "About", href: "/about" },
  { title: "Journals", href: "/journals" },
  { title: "Projects", href: "/projects" },
  // { title: "Resume", href: "/resume" },
];
