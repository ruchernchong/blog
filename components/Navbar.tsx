import { useRouter } from "next/router";
import NextLink from "next/link";
import classNames from "classnames";

const NavItem = ({ href, title }) => {
  const router = useRouter();
  const isActive = router.asPath === href;

  return (
    <NextLink
      href={href}
      className={classNames(
        isActive
          ? "font-semibold underline underline-offset-8 dark:text-sky-300"
          : "dark:text-neutral-50"
      )}
    >
      {title}
    </NextLink>
  );
};

export default function Navbar() {
  return (
    <div className="sticky top-0 mx-auto mb-8 max-w-4xl bg-neutral-50 p-8 dark:bg-neutral-900">
      <nav className="flex items-center justify-start space-x-4">
        <NavItem href="/" title="Home" />
        {/*<NavItem href="/projects" title="Projects" />*/}
      </nav>
    </div>
  );
}
