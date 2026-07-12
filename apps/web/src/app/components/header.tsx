"use client";

import { cn } from "@heroui/react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/logo-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { navLinks } from "@/config";

const links: { title: string; href: Route }[] = [
  { title: "Home", href: "/" },
  ...navLinks,
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="flex justify-center px-4 pt-10">
      <div className="flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full border border-border bg-surface p-1.5">
        <Link href="/" aria-label="Home" className="mr-1 flex shrink-0">
          <LogoMark size={30} />
        </Link>
        {links.map(({ title, href }) => {
          const isActive =
            pathname === href || (pathname.startsWith(href) && href !== "/");

          return (
            <Link
              key={title}
              href={href}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-sm transition-colors",
                isActive
                  ? "bg-default font-semibold text-foreground"
                  : "font-medium text-muted hover:text-foreground",
              )}
            >
              {title}
            </Link>
          );
        })}
        <ThemeToggle />
      </div>
    </header>
  );
}
