import Image from "next/image";
import Link from "next/link";
import ExternalLink from "@/components/ExternalLink";
import * as Icons from "@/components/Icons";
import { BASE_URL, navLinks } from "@/config";
import socials from "@/data/socials.json";
import Icon from "@/app/icon.png";

export const Footer = () => {
  // Temporary removed links
  const EXCLUDED_LINKS = ["RSS", "Stackoverflow"];

  const filteredLinks = socials.filter(
    ({ name }) => !EXCLUDED_LINKS.includes(name)
  );

  return (
    <footer className="bg-gray-800 py-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-y-4 px-4">
        <div className="flex flex-col gap-y-4 md:flex-row md:justify-between">
          <div className="flex flex-col">
            <Image src={Icon} width={64} height={64} alt="Site logo" />
          </div>
          <div className="flex gap-x-16 md:basis-1/3 md:justify-between">
            <div className="flex flex-col gap-4">
              <Link href="/">Home</Link>
              {navLinks.map(({ href, title }) => {
                return (
                  <Link key={title} href={href}>
                    {title}
                  </Link>
                );
              })}
            </div>
            <div className="flex flex-col gap-4">
              {filteredLinks.map(({ name, link }) => {
                if (/\$BASE_URL/.test(link)) {
                  link = link.replace("$BASE_URL", BASE_URL);
                }

                return (
                  <div key={name}>
                    <ExternalLink href={link} className="hover:text-pink-500">
                      <div className="inline-flex items-center gap-x-2 md:flex">
                        <Icons.Social name={name} className="h-4 w-4" />
                        {name}
                      </div>
                    </ExternalLink>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div>
          &copy; {new Date().getFullYear()} Chong Ru Chern. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
};
