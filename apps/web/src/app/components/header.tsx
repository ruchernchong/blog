"use client";

import { Button, cn } from "@heroui/react";
import { Cancel01Icon, Menu01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { navLinks, SITE_NAME } from "@/config";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-50 border-border border-b bg-background/85 backdrop-blur">
      <div className="container mx-auto flex h-14 items-center justify-between gap-4 px-4">
        <Link
          href="/"
          aria-label={`${SITE_NAME}, home`}
          className="flex items-center gap-2"
        >
          <Logo priority />
          <span className="font-mono text-foreground text-sm">home</span>
        </Link>

        {/* Desktop nav */}
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-1 md:flex"
        >
          {navLinks.map(({ title, href }) => (
            <Link
              key={title}
              href={href as Route}
              aria-current={isActive(href) ? "page" : undefined}
              className={cn(
                "rounded-md px-2.5 py-1.5 font-mono text-sm lowercase",
                isActive(href)
                  ? "text-accent"
                  : "text-muted hover:text-foreground",
              )}
            >
              {title}
            </Link>
          ))}
          <span aria-hidden className="mx-1 h-4 w-px bg-border" />
          <ThemeToggle />
        </nav>

        {/* Mobile controls */}
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onPress={() => setOpen((v) => !v)}
          >
            <HugeiconsIcon icon={open ? Cancel01Icon : Menu01Icon} size={18} />
          </Button>
        </div>
      </div>

      {/* Mobile panel */}
      {open && (
        <nav
          aria-label="Mobile navigation"
          className="border-border border-t bg-background md:hidden"
        >
          <div className="container mx-auto flex flex-col px-4 py-2">
            {navLinks.map(({ title, href }) => (
              <Link
                key={title}
                href={href as Route}
                aria-current={isActive(href) ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-md px-2 py-2.5 font-mono text-sm lowercase",
                  isActive(href)
                    ? "text-accent"
                    : "text-muted hover:text-foreground",
                )}
              >
                {title}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
