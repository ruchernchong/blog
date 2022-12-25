import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import NextLink from "next/link";
import { useTheme } from "next-themes";

import classNames from "classnames";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";

const NavItem = ({ href, title }) => {
  const router = useRouter();
  const isActive = router.asPath === href;

  return (
    <NextLink
      href={href}
      className={classNames(
        isActive
          ? "font-semibold underline underline-offset-8"
          : "dark:text-neutral-50"
      )}
    >
      {title}
    </NextLink>
  );
};

export default function Navbar() {
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const { resolvedTheme, setTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";

  useEffect(() => setIsMounted(true), []);

  return (
    <div className="sticky top-0 z-[1000] mx-auto mb-8 max-w-4xl bg-neutral-50 p-8 dark:bg-neutral-900">
      <nav className="flex items-center justify-between">
        <div className="space-x-6">
          <NavItem href="/" title="Home" />
          {/*<NavItem href="/projects" title="Projects" />*/}
        </div>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-200 ring-2 ring-neutral-600 transition-all hover:ring-2 dark:bg-neutral-900"
          onClick={() => setTheme(isDarkMode ? "light" : "dark")}
        >
          {isMounted && (
            <div className="h-6 w-6">
              {isDarkMode ? <SunIcon /> : <MoonIcon />}
            </div>
          )}
        </button>
      </nav>
    </div>
  );
}
