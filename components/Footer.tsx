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
      className="mr-6 transition last:m-0 hover:opacity-50"
    >
      {children}
    </a>
  );
};
export default function Footer() {
  return (
    <footer className="mx-auto flex max-w-4xl flex-col items-center justify-center">
      <hr className="border-1 mb-8 w-full border-neutral-200 dark:border-neutral-800" />
      <div className="mb-8 flex justify-between">
        <ExternalLink href="https://github.com/ruchernchong">
          <IconGithub
            width={24}
            height={24}
            className="dark:fill-neutral-400"
          />
        </ExternalLink>
        <ExternalLink href="https://www.linkedin.com/in/ruchernchong">
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
