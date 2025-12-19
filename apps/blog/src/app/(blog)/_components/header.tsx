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

export const Header = () => {
  const pathname = usePathname();

  return (
    <header className="fixed top-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2 rounded-full border border-border/50 bg-background/80 px-6 py-2 shadow-sm backdrop-blur-lg transition-all duration-300">
      <div className="flex items-center justify-between">
        <NavItem
          href="/"
          className="font-bold text-lg text-foreground transition-colors duration-300 hover:text-muted-foreground"
          title="Ru Chern"
        >
          <div className="flex items-center gap-2">
            <Image src={Icon} width={32} height={32} alt="Logo" />
          </div>
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
                  "font-medium text-sm transition-all duration-300 ease-out",
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
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
};

const NavItem = ({ href, className, children }: NavItemProps) => {
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
};
