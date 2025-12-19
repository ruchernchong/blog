"use client";

import type { Route } from "next";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Link } from "next-view-transitions";
import type { PropsWithChildren } from "react";
import Icon from "@/app/(blog)/icon.png";
import { navLinks } from "@/config";
import { cn } from "@/lib/utils";

interface NavItemProps extends PropsWithChildren {
  href: Route;
  className?: string;
  title?: string;
}

export function Header() {
  const pathname = usePathname();

  return (
    <header className="fixed top-4 right-4 left-4 z-50 mx-auto max-w-4xl rounded-full border border-border/50 bg-background/50 px-6 py-2 shadow-sm backdrop-blur-lg transition-all duration-300">
      <div className="flex items-center justify-between">
        <NavItem
          href="/"
          className="font-bold text-foreground text-lg transition-all duration-200 hover:text-primary"
          title="Ru Chern"
        >
          <div className="flex items-center gap-2">
            <div className="rounded-lg border border-transparent p-0.5 transition-all duration-200 hover:border-primary/30 hover:shadow-[0_4px_12px_-4px_theme(colors.primary/0.25)]">
              <Image src={Icon} width={28} height={28} alt="Logo" />
            </div>
          </div>
        </NavItem>
        <nav className="flex items-center gap-6">
          {navLinks.map(({ title, href }) => {
            const isActive =
              pathname === href || (pathname.startsWith(href) && href !== "/");

            return (
              <NavItem
                key={title}
                href={href}
                className={cn(
                  "font-medium text-sm transition-all duration-200",
                  isActive
                    ? "text-primary underline underline-offset-4 decoration-primary decoration-2"
                    : "text-muted-foreground hover:text-foreground",
                )}
                title={title}
              >
                {title}
              </NavItem>
            );
          })}
        </nav>
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
