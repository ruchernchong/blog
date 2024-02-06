"use client";
import { type PropsWithChildren } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import classNames from "classnames";
import { navLinks } from "@/config";

interface NavItemProps extends PropsWithChildren {
  href: string;
  className?: string;
}

export const Header = () => {
  const pathname = usePathname();
  const isHomePage = Boolean(pathname === "/");

  return (
    <div className="shadow shadow-gray-800">
      <header className="mx-auto flex max-w-4xl items-center px-4 py-8">
        <NavItem
          href="/"
          className={classNames("font-semibold", {
            "text-pink-500 underline underline-offset-8": isHomePage,
            "hover:text-pink-500": !isHomePage,
          })}
        >
          Home
        </NavItem>
        <nav className="flex grow justify-end gap-x-6">
          {navLinks.map(({ title, href }) => {
            const isActive = pathname.startsWith(href) && href !== "/";

            return (
              <NavItem
                key={title}
                href={href}
                className={classNames("font-semibold", {
                  "text-pink-500 underline underline-offset-8": isActive,
                  "hover:text-pink-500": !isActive,
                })}
              >
                {title}
              </NavItem>
            );
          })}
        </nav>
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
