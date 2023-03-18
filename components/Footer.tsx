import Link from "next/link";
import IconGithub from "public/icon-github.svg";
import IconLinkedIn from "public/icon-linkedin.svg";
import IconStackOverflow from "public/icon-stackoverflow.svg";
import IconRss from "public/icon-rss.svg";
import { HOST_URL } from "@/config";
import { navLinks } from "@/config/navLinks";

const LinkHeader = ({ children }) => {
  return (
    <div className="text-lg font-medium text-neutral-900 dark:text-neutral-50">
      {children}
    </div>
  );
};

const ExternalLink = ({ href, children }) => {
  return (
    <div className="flex items-center hover:text-neutral-400 dark:text-neutral-400 dark:hover:text-neutral-50">
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
  <footer className="bg-neutral-100 py-8 dark:bg-neutral-800 md:py-16">
    <div className="mx-auto max-w-4xl gap-4 px-4 md:grid md:grid-cols-3">
      <div className="mb-8 flex flex-col items-start md:mb-0">
        <div className="mb-4 text-xl font-medium text-neutral-900 dark:text-neutral-50">
          Ru Chern CHONG
        </div>
        <div className="text-xl text-neutral-900 dark:text-neutral-400">
          Developer | Investor | Author
        </div>
      </div>
      <div className="mb-8 flex flex-col items-start gap-4 md:mb-0">
        <LinkHeader>Sitemap</LinkHeader>
        {navLinks.map(({ href, title }) => {
          return (
            <Link
              key={title}
              href={href}
              className="hover:text-neutral-400 dark:text-neutral-400 dark:hover:text-neutral-50"
            >
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
