import { useRouter } from "next/router";
import NextLink from "next/link";
import classNames from "classnames";
import ThemeToggle from "components/ThemeToggle";
import { isFeatureEnabled } from "lib/isFeatureEnabled";

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

const Navbar = () => (
  <div className="sticky top-0 z-[1000] mx-auto max-w-4xl bg-neutral-50 px-4 py-8 dark:bg-neutral-900 md:mb-8">
    <nav className="flex items-center justify-between">
      <div className="space-x-6">
        <NavItem href="/" title="Home" />
        <NavItem href="/about" title="About" />
        <NavItem href="/random-musings" title="Random Musings" />
        {/*<NavItem href="/projects" title="Projects" />*/}
        {isFeatureEnabled(process.env.NEXT_PUBLIC_FEATURE_RESUME_PAGE) && (
          <NavItem href="/resume" title="Resume" />
        )}
      </div>
      <ThemeToggle />
    </nav>
  </div>
);

export default Navbar;
