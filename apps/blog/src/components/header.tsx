"use client";

import { type PropsWithChildren } from "react";
import { Link } from "next-view-transitions";
import { usePathname } from "next/navigation";
import classNames from "classnames";
import { navLinks } from "@/config";
import Image from "next/image";
import Icon from "@/app/icon.png";

interface NavItemProps extends PropsWithChildren {
  href: string;
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
            className="text-lg font-bold text-white transition-colors duration-300 hover:text-pink-500"
            title="Ru Chern"
          >
            <div className="flex items-center gap-2">
              <Image src={Icon} width={32} height={32} alt="Logo" />
              <span className="rounded-full bg-pink-500/20 border border-pink-500/30 px-2 py-0.5 text-xs font-medium text-pink-400">
                beta
              </span>
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
                  className={classNames(
                    "text-sm font-medium transition-all duration-300 ease-out",
                    {
                      "text-white": isActive,
                      "text-gray-400 hover:text-white": !isActive,
                    },
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

const NavItem = ({ href, className, children, title }: NavItemProps) => {
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
};
