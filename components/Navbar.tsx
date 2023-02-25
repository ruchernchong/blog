import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import NextLink from "next/link";
import classNames from "classnames";
import ThemeToggle from "components/ThemeToggle";
import { isFeatureEnabled } from "lib/isFeatureEnabled";
import { Bars3Icon } from "@heroicons/react/24/outline";

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

const Navbar = () => {
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
        <div className="mb-2 flex items-center justify-end px-4 py-4">
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
            "absolute z-10 h-full w-full bg-neutral-50 dark:bg-neutral-900",
            {
              hidden: !expand,
              block: expand,
            }
          )}
        >
          <ul className="flex flex-col rounded-lg bg-neutral-50 text-center dark:border-neutral-700 dark:bg-neutral-900">
            <li className="border-b border-neutral-600 py-4">
              <NavItem href="/" title="Home" />
            </li>
            {isFeatureEnabled(process.env.NEXT_PUBLIC_FEATURE_BLOG_PAGE) && (
              <li className="border-b border-neutral-600 py-4">
                <NavItem href="/blog" title="Blog" />
              </li>
            )}
            <li className="border-b border-neutral-600 py-4">
              <NavItem href="/about" title="About" />
            </li>
            <li className="border-b border-neutral-600 py-4">
              <NavItem href="/random-musings" title="Random Musings" />
            </li>
            {isFeatureEnabled(
              process.env.NEXT_PUBLIC_FEATURE_PROJECTS_PAGE
            ) && (
              <li className="border-b border-neutral-600 py-4">
                <NavItem href="/projects" title="Projects" />
              </li>
            )}
            {isFeatureEnabled(process.env.NEXT_PUBLIC_FEATURE_RESUME_PAGE) && (
              <li className="border-b border-neutral-600 py-4">
                <NavItem href="/resume" title="Resume" />
              </li>
            )}
          </ul>
          <div className="flex flex-col items-center py-8">
            <ThemeToggle />
          </div>
        </div>
      </div>
      <div className="mx-auto hidden max-w-4xl px-4 py-8 md:mb-8 md:block">
        <nav className="flex items-center justify-between">
          <div className="space-x-6">
            <NavItem href="/" title="Home" />
            {isFeatureEnabled(process.env.NEXT_PUBLIC_FEATURE_BLOG_PAGE) && (
              <NavItem href="/blog" title="Blog" />
            )}
            <NavItem href="/about" title="About" />
            <NavItem href="/random-musings" title="Random Musings" />
            {isFeatureEnabled(
              process.env.NEXT_PUBLIC_FEATURE_PROJECTS_PAGE
            ) && <NavItem href="/projects" title="Projects" />}
            {isFeatureEnabled(process.env.NEXT_PUBLIC_FEATURE_RESUME_PAGE) && (
              <NavItem href="/resume" title="Resume" />
            )}
          </div>
          <ThemeToggle />
        </nav>
      </div>
    </>
  );
};

export default Navbar;
