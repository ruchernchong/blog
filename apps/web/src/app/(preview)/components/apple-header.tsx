"use client";

import { cn } from "@heroui/react";
import { Navbar } from "@heroui-pro/react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { navLinks } from "@/config";

export function AppleHeader() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <header className="sticky inset-x-0 top-0 z-50">
      <Navbar
        className="rounded-none border-border/50 border-b bg-background/90 shadow-none backdrop-blur-xl"
        height="2.75rem"
        maxWidth="full"
        navigate={(href) => router.push(href as Route)}
        position="static"
        shouldBlockScroll={false}
        size="sm"
      >
        <Navbar.Header className="container mx-auto px-6">
          <Navbar.Brand>
            <Link
              aria-label="Ru Chern home"
              className="flex items-center gap-2 text-foreground transition-colors hover:text-accent"
              href="/preview"
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
          <Navbar.MenuItem href="/preview" isCurrent={pathname === "/preview"}>
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
