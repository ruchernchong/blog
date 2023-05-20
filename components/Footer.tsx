"use client";

import Link from "next/link";
import ExternalLink from "@/components/ExternalLink";
import * as Icons from "@/components/Icons";
import { navLinks } from "@/config/navLinks";
import { socials } from "@/data/socials";

const LinkHeader = ({ children }) => {
  return (
    <div className="text-lg font-medium text-neutral-900 dark:text-neutral-50">
      {children}
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
              className="hover:text-neutral-400 dark:text-neutral-400 dark:hover:text-indigo-300"
            >
              {title}
            </Link>
          );
        })}
      </div>
      <div className="flex flex-col items-start gap-4">
        <LinkHeader>Social</LinkHeader>
        <div className="flex gap-x-4">
          {socials.map(({ name, link }) => {
            return (
              <ExternalLink key={name} href={link}>
                <Icons.Social
                  name={name}
                  className="dark:hover:fill-indigo-300"
                />
              </ExternalLink>
            );
          })}
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
