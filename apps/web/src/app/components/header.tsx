"use client";

import { cn } from "@heroui/react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PropsWithChildren } from "react";
import { Logo } from "@/components/logo";
import { navLinks } from "@/config";

interface NavItemProps extends PropsWithChildren {
  href: Route;
  className?: string;
  title?: string;
}

export function Header() {
  const pathname = usePathname();

  return (
    <header className="fixed top-4 right-4 left-4 z-50">
      <div className="container mx-auto rounded-full border border-border/50 bg-background/50 px-6 py-2 shadow-sm backdrop-blur-lg transition-all duration-300">
        <div className="flex items-center justify-between">
          <NavItem
            href="/"
            className="font-bold text-foreground text-lg transition-all duration-200 hover:text-accent"
            title="Ru Chern"
          >
            <Logo />
          </NavItem>
          <nav className="flex items-center gap-6">
            {navLinks.map(({ title, href }) => {
              const isActive =
                pathname === href ||
                (pathname.startsWith(href) && href !== "/");

              return (
                <NavItem
                  key={title}
                  href={href}
                  className={cn(
                    "font-medium text-sm transition-all duration-200",
                    isActive
                      ? "text-accent underline decoration-2 decoration-primary underline-offset-4"
                      : "text-muted hover:text-foreground",
                  )}
                  title={title}
                >
                  {title}
                </NavItem>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}

function NavItem({ href, className, children }: NavItemProps) {
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
