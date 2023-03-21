import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import NextLink from "next/link";
import classNames from "classnames";
import ThemeToggle from "@/components/ThemeToggle";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { navLinks } from "@/config/navLinks";

const NavItem = ({ href, title }) => {
  const router = useRouter();
  const isActive = router.asPath === href;

  return (
    <NextLink
      href={href}
      className={classNames(isActive && "underline underline-offset-8")}
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
      <div className="mb-8 w-screen md:hidden">
        <div className="flex items-center justify-end px-4 py-4">
          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-200 ring-2 ring-neutral-600 transition-all hover:ring-2 dark:bg-neutral-900"
            onClick={() => setExpand(!expand)}
          >
            <div className="h-6 w-6">
              <Bars3Icon />
            </div>
          </button>
        </div>
        <div
          className={classNames(
            "absolute z-10 h-full w-screen bg-neutral-50 dark:bg-neutral-900",
            {
              hidden: !expand,
              block: expand,
            }
          )}
        >
          <ul className="flex flex-col bg-neutral-50 text-center dark:border-neutral-700 dark:bg-neutral-900">
            {navLinks.map(({ title, href }) => {
              return (
                <li key={title} className="border-b border-neutral-600 py-4">
                  <NavItem key={title} href={href} title={title} />
                </li>
              );
            })}
          </ul>
          <div className="flex flex-col items-center py-8">
            <ThemeToggle />
          </div>
        </div>
      </div>
      <div className="hidden w-screen md:block">
        <div className="mx-auto max-w-4xl px-4 py-8 md:mb-8">
          <nav className="flex items-center justify-between">
            <div className="space-x-6">
              {navLinks.map(({ title, href }) => {
                return <NavItem key={title} href={href} title={title} />;
              })}
            </div>
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </>
  );
};

export default Header;
