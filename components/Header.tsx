"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import classNames from "classnames";
import { Bars3Icon, HomeIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { navLinks } from "@/config";

interface NavItemProps {
  href: string;
  title: string;
  className?: string;
}

const Header = () => {
  return (
    <>
      <MobileNavbar />
      <DesktopNavbar />
    </>
  );
};

const DesktopNavbar = () => {
  const pathname = usePathname();

  return (
    <div className="hidden shadow shadow-gray-800 md:block">
      <nav className="mx-auto flex max-w-4xl gap-x-6 px-4 py-8">
        {navLinks.map(({ title, href }) => {
          const isActive = pathname.startsWith(href) && href !== "/";

          return (
            <NavItem
              key={title}
              href={href}
              title={title}
              className={classNames("font-semibold", {
                "text-pink-500 underline underline-offset-8": isActive,
                "hover:text-pink-500": !isActive,
              })}
            />
          );
        })}
      </nav>
    </div>
  );
};

const MobileNavbar = () => {
  const pathname = usePathname();
  const [expand, setExpand] = useState<boolean>(false);

  // TODO: Will find a better way to update this with context and _document.tsx
  useEffect(() => {
    if (expand) {
      document.body.classList.add("fixed", "overflow-y-scroll");
    } else {
      document.body.classList.remove("fixed", "overflow-y-scroll");
    }
  }, [expand]);

  return (
    <div className="sticky top-0 z-50 w-screen bg-gray-900 shadow shadow-gray-800 md:hidden">
      <div className="flex items-center justify-between px-4 py-4">
        <Link href="/" className="font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg ring-2 ring-gray-600 focus:ring-gray-400">
            <HomeIcon className="h-6 w-6" />
          </span>
        </Link>
        <button
          aria-label="Mobile menu"
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 ring-2 ring-gray-600 focus:ring-gray-400"
          onClick={() => setExpand(!expand)}
        >
          <div className="h-6 w-6">
            {!expand && <Bars3Icon />}
            {expand && <XMarkIcon />}
          </div>
        </button>
      </div>
      {expand && (
        <div className="absolute z-50 h-full w-screen bg-transparent" />
      )}
      <div
        className={classNames(
          "absolute z-50 w-full rounded-lg border border-gray-600 bg-gray-800",
          {
            hidden: !expand,
            block: expand,
          }
        )}
      >
        <ul className="flex flex-col">
          {navLinks.map(({ title, href }) => {
            const isActive = pathname.startsWith(href) && href !== "/";

            return (
              <li
                key={title}
                className="p-2"
                onClick={() => setExpand((prevState) => !prevState)}
              >
                <NavItem
                  href={href}
                  title={title}
                  className={classNames("block rounded-lg p-2 font-semibold", {
                    "bg-pink-500 text-gray-50": isActive,
                    "hover:bg-gray-600": !isActive,
                  })}
                />
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

const NavItem = ({ href, title, className }: NavItemProps) => {
  return (
    <Link href={href} className={className}>
      {title}
    </Link>
  );
};

export default Header;
