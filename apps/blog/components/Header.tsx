"use client";
import { type PropsWithChildren } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import classNames from "classnames";
import { navLinks } from "@/config";

interface NavItemProps extends PropsWithChildren {
  href: string;
  className?: string;
  title?: string;
}

export const Header = () => {
  const pathname = usePathname();
  const isHomePage = Boolean(pathname === "/");

  return (
    <div
      className="shadow-sm shadow-zinc-800"
      data-umami-event="header-interaction"
    >
      <header className="mx-auto flex max-w-4xl items-center px-4 py-8">
        <NavItem
          href="/"
          className={classNames("font-semibold", {
            "text-pink-500 underline underline-offset-8": isHomePage,
            "hover:text-pink-500": !isHomePage,
          })}
          title="Home"
        >
          Home
        </NavItem>
        <nav
          className="flex grow justify-end gap-x-6"
          data-umami-event="navigation-interaction"
        >
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
                title={title}
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
