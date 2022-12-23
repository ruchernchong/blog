import { HOST_URL } from "lib/config";

import IconGithub from "public/icon-github.svg";
import IconLinkedIn from "public/icon-linkedin.svg";
import IconStackOverflow from "public/icon-stackoverflow.svg";
import IconRss from "public/icon-rss.svg";

const ExternalLink = ({ href, children }) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="me noreferrer"
      className="transition hover:opacity-50 mr-6 last:m-0"
    >
      {children}
    </a>
  );
};
export default function Footer() {
  return (
    <footer className="flex flex-col justify-center items-center max-w-2xl mx-auto">
      <hr className="w-full border-1 border-neutral-200 dark:border-neutral-800 mb-8" />
      <div className="flex justify-between mb-8">
        <ExternalLink href="https://github.com/ruchern-chong">
          <IconGithub
            width={24}
            height={24}
            className="dark:fill-neutral-400"
          />
        </ExternalLink>
        <ExternalLink href="https://www.linkedin.com/in/ruchern-chong">
          <IconLinkedIn
            width={24}
            height={24}
            className="dark:fill-neutral-400"
          />
        </ExternalLink>
        <ExternalLink href="https://stackoverflow.com/users/4031163/ru-chern-chong">
          <IconStackOverflow
            width={24}
            height={24}
            className="dark:fill-neutral-400"
          />
        </ExternalLink>
        <ExternalLink href={`${HOST_URL}/feed.xml`}>
          <IconRss width={24} height={24} className="dark:fill-neutral-400" />
        </ExternalLink>
      </div>
    </footer>
  );
}
