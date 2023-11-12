"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import NextLink from "next/link";
import classNames from "classnames";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

import { navLinks } from "@/config";

type NavItem = {
  href: string;
  title: string;
};

const NavItem = ({ href, title }: NavItem) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <NextLink
      href={href}
      className={classNames("font-semibold", {
        "text-indigo-300 underline underline-offset-8": isActive,
        "hover:text-indigo-300": !isActive,
      })}
    >
      {title}
    </NextLink>
  );
};

const Header = () => {
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
    <>
      <div className="w-screen md:hidden">
        <div className="flex items-center justify-end px-4 py-4">
          <button
            aria-label="Mobile menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 ring-2 ring-neutral-600 transition-all hover:ring-2"
            onClick={() => setExpand(!expand)}
          >
            <div className="h-6 w-6 transition-all">
              {!expand && <Bars3Icon />}
              {expand && <XMarkIcon />}
            </div>
          </button>
        </div>
        <div
          className={classNames(
            "absolute z-10 h-full w-screen bg-neutral-900",
            {
              hidden: !expand,
              block: expand,
            }
          )}
        >
          <ul className="flex flex-col bg-neutral-900 text-center">
            {navLinks.map(({ title, href }) => {
              return (
                <li
                  key={title}
                  className="border-b border-neutral-600 py-4"
                  onClick={() => setExpand((prevState) => !prevState)}
                >
                  <NavItem key={title} href={href} title={title} />
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <div className="hidden w-screen md:block">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <nav className="flex items-center justify-between">
            <div className="space-x-6">
              {navLinks.map(({ title, href }) => {
                return <NavItem key={title} href={href} title={title} />;
              })}
            </div>
          </nav>
        </div>
      </div>
    </>
  );
};

export default Header;
