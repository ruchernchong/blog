"use client";

import { Navbar } from "@heroui-pro/react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { navLinks, SITE_NAME } from "@/config";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <Navbar navigate={(href) => router.push(href as Route)} maxWidth="2xl">
      <Navbar.Header>
        <Navbar.MenuToggle className="md:hidden" />
        <Navbar.Brand>
          <Link
            href="/"
            aria-label={`${SITE_NAME}, home`}
            className="flex items-center gap-2"
          >
            <Logo priority />
            <span className="font-mono text-foreground text-sm">home</span>
          </Link>
        </Navbar.Brand>

        <Navbar.Spacer />

        <Navbar.Content className="hidden md:flex">
          {navLinks.map(({ title, href }) => (
            <Navbar.Item key={title} href={href} isCurrent={isActive(href)}>
              {title}
            </Navbar.Item>
          ))}
          <Navbar.Separator />
          <ThemeToggle />
        </Navbar.Content>

        <div className="md:hidden">
          <ThemeToggle />
        </div>
      </Navbar.Header>

      <Navbar.Menu>
        {navLinks.map(({ title, href }) => (
          <Navbar.MenuItem key={title} href={href} isCurrent={isActive(href)}>
            {title}
          </Navbar.MenuItem>
        ))}
      </Navbar.Menu>
    </Navbar>
  );
}
