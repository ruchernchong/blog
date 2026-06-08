"use client";

import { cn } from "@heroui/react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { navLinks } from "@/config";

const minimalHref = (href: string) => `/minimal${href}`;

export function MinimalHeader() {
  const pathname = usePathname();

  return (
    <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <nav
        aria-label="Main navigation"
        className="flex items-center gap-1 rounded-full border border-border bg-background/90 px-2 py-1.5 shadow-sm backdrop-blur-sm"
      >
        <Link
          aria-label="Ru Chern home"
          href="/minimal"
          className={cn(
            "flex size-8 items-center justify-center rounded-full transition-colors hover:bg-default",
            pathname === "/minimal" && "bg-default",
          )}
        >
          <Logo priority />
        </Link>

        <div className="mx-1.5 h-4 w-px bg-border" />

        {navLinks.map(({ title, href }) => {
          const full = minimalHref(href) as Route;
          const isActive =
            pathname === full || (href !== "/" && pathname.startsWith(full));

          return (
            <Link
              key={title}
              href={full}
              className={cn(
                "rounded-full px-3 py-1.5 font-medium text-sm transition-colors",
                isActive
                  ? "bg-foreground text-background"
                  : "text-muted hover:bg-default hover:text-foreground",
              )}
            >
              {title}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
