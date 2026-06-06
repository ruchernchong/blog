"use client";

import { cn } from "@heroui/react";
import { Navbar } from "@heroui-pro/react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { navLinks } from "@/config";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <header className="container fixed top-4 right-4 left-4 z-50 mx-auto">
      <Navbar
        className="rounded-full border border-border/70 bg-background/80 shadow-surface backdrop-blur-xl"
        height="3.25rem"
        maxWidth="full"
        navigate={(href) => router.push(href as Route)}
        position="static"
        shouldBlockScroll={false}
        size="sm"
      >
        <Navbar.Header className="px-4 sm:px-5">
          <Navbar.Brand>
            <Link
              aria-label="Ru Chern home"
              className="flex items-center gap-2 text-foreground transition-colors hover:text-accent"
              href="/"
            >
              <Logo priority />
              <span className="hidden font-semibold text-sm sm:inline">
                Ru Chern
              </span>
            </Link>
          </Navbar.Brand>

          <Navbar.Content className="hidden md:flex">
            {navLinks.map(({ title, href }) => {
              const isActive =
                pathname === href ||
                (pathname.startsWith(href) && href !== "/");

              return (
                <Navbar.Item
                  className={cn(
                    "px-2.5 font-medium text-sm",
                    isActive && "text-foreground",
                  )}
                  href={href}
                  isCurrent={isActive}
                  key={title}
                >
                  {title}
                </Navbar.Item>
              );
            })}
          </Navbar.Content>

          <Navbar.Spacer />

          <Navbar.MenuToggle className="md:hidden" />
        </Navbar.Header>

        <Navbar.Menu>
          <Navbar.MenuItem href="/" isCurrent={pathname === "/"}>
            Home
          </Navbar.MenuItem>
          {navLinks.map(({ title, href }) => {
            const isActive =
              pathname === href || (pathname.startsWith(href) && href !== "/");

            return (
              <Navbar.MenuItem href={href} isCurrent={isActive} key={title}>
                {title}
              </Navbar.MenuItem>
            );
          })}
        </Navbar.Menu>
      </Navbar>
    </header>
  );
}
