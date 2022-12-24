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
          ? "dark:text-sky-300 font-semibold underline underline-offset-8"
          : "dark:text-neutral-50"
      )}
    >
      {title}
    </NextLink>
  );
};

export default function Navbar() {
  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 max-w-4xl mx-auto p-8 mb-8 sticky top-0">
      <nav className="flex justify-start items-center space-x-4">
        <NavItem href="/" title="Home" />
        {/*<NavItem href="/projects" title="Projects" />*/}
      </nav>
    </div>
  );
}
