import Link from "next/link";
import IconGithub from "public/icon-github.svg";
import IconLinkedIn from "public/icon-linkedin.svg";
import IconStackOverflow from "public/icon-stackoverflow.svg";
import IconRss from "public/icon-rss.svg";
import { HOST_URL } from "@/config";
import { navLinks } from "@/config/navLinks";

const LinkHeader = ({ children }) => {
  return (
    <div className="mb-4 text-lg font-medium text-neutral-900 dark:text-neutral-50">
      {children}
    </div>
  );
};

const ExternalLink = ({ href, children }) => {
  return (
    <div className="flex items-center dark:text-neutral-400">
      <a
        href={href}
        target="_blank"
        rel="me noopenner noreferrer nofollow"
        aria-label="Link to social media"
        className="flex items-center font-semibold"
      >
        {children}
      </a>
    </div>
  );
};

const Footer = () => (
  <footer className="border-t border-neutral-600 py-8 px-4">
    <div className="mx-auto grid max-w-4xl grid-cols-2">
      <div className="flex flex-col items-start gap-4 dark:text-neutral-400">
        <LinkHeader>Sitemap</LinkHeader>
        {navLinks.map(({ href, title }) => {
          return (
            <Link key={title} href={href}>
              {title}
            </Link>
          );
        })}
      </div>
      <div className="flex flex-col items-start gap-4">
        <LinkHeader>Social</LinkHeader>
        <ExternalLink href="https://github.com/ruchernchong">
          <IconGithub
            width={24}
            height={24}
            className="mr-2 dark:fill-neutral-400"
          />
          <span>GitHub</span>
        </ExternalLink>
        <ExternalLink href="https://www.linkedin.com/in/ruchernchong">
          <IconLinkedIn
            width={24}
            height={24}
            className="mr-2 dark:fill-neutral-400"
          />
          <span>LinkedIn</span>
        </ExternalLink>
        <ExternalLink href="https://stackoverflow.com/users/4031163/ru-chern-chong">
          <IconStackOverflow
            width={24}
            height={24}
            className="mr-2 dark:fill-neutral-400"
          />
          <span>Stack Overflow</span>
        </ExternalLink>
        <ExternalLink href={`${HOST_URL}/feed.xml`}>
          <IconRss
            width={24}
            height={24}
            className="mr-2 dark:fill-neutral-400"
          />
          <span>RSS</span>
        </ExternalLink>
      </div>
    </div>
  </footer>
);

export default Footer;
