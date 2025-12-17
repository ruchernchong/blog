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
    <div className="fixed top-6 left-1/2 z-50 w-full -translate-x-1/2 px-4 md:max-w-4xl">
      <header className="w-full rounded-2xl border border-white/10 bg-black/20 px-8 py-3 shadow-2xl backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <NavItem
            href="/"
            className="font-bold text-lg text-white transition-colors duration-300 hover:text-pink-500"
            title="Ru Chern"
          >
            <div className="flex items-center gap-2">
              <Image src={Icon} width={32} height={32} alt="Logo" />
            </div>
          </NavItem>
          <nav className="flex items-center gap-x-6">
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
                    isActive ? "text-white" : "text-gray-400 hover:text-white",
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
    </div>
  );
};

const NavItem = ({ href, className, children }: NavItemProps) => {
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
};
