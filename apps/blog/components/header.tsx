"use client";

import { type PropsWithChildren } from "react";
import Link from "next/link";
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
    <div
      className="sticky top-6 left-1/2 z-50 w-[90vw] max-w-4xl -translate-x-1/2"
      data-umami-event="header-interaction"
    >
      <header className="w-full rounded-full border border-white/10 bg-black/20 px-8 py-3 shadow-2xl backdrop-blur-lg">
        <div className="flex items-center justify-between">
          <NavItem
            href="/"
            className="text-lg font-bold text-white transition-colors duration-300 hover:text-pink-500"
            title="Ru Chern"
          >
            <Image src={Icon} width={32} height={32} alt="Logo" />
          </NavItem>
          <nav
            className="flex items-center gap-x-6"
            data-umami-event="navigation-interaction"
          >
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
    <Link
      href={href}
      className={className}
      data-umami-event="navigation-link-click"
      data-umami-event-link={href}
      data-umami-event-title={title}
    >
      {children}
    </Link>
  );
};
