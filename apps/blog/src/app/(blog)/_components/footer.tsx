import Image from "next/image";
import Link from "next/link";
import Icon from "@/app/(blog)/icon.png";
import ExternalLink from "@/components/shared/external-link";
import * as Icons from "@/components/shared/icons";
import { navLinks, VERSION } from "@/config";
import socials from "@/data/socials";

export const Footer = () => (
  <div className="mx-auto flex w-full max-w-4xl justify-center px-4 pb-6">
    <footer className="w-full border-t border-border bg-background px-8 py-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <Image src={Icon} width={48} height={48} alt="Logo" />
          <div className="flex gap-6 md:gap-8">
            <div className="flex flex-col gap-4">
              <Link
                href="/"
                className="font-medium text-muted-foreground text-sm transition-colors duration-300 hover:text-foreground"
              >
                Home
              </Link>
              {navLinks.map(({ href, title }) => {
                return (
                  <Link
                    key={title}
                    href={href}
                    className="font-medium text-muted-foreground text-sm transition-colors duration-300 hover:text-foreground"
                  >
                    {title}
                  </Link>
                );
              })}
            </div>
            <div className="flex flex-col gap-4">
              {socials.map(({ name, link }) => (
                <div key={name}>
                  <ExternalLink
                    href={link}
                    className="font-medium text-muted-foreground text-sm transition-colors duration-300 hover:text-foreground"
                    title={name}
                  >
                    <div className="inline-flex items-center gap-2">
                      <Icons.Social name={name} className="h-4 w-4" />
                      {name}
                    </div>
                  </ExternalLink>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 text-center text-muted-foreground text-sm md:flex-row md:items-center md:justify-between md:text-left">
          <span>&copy; {new Date().getFullYear()} Chong Ru Chern. All Rights Reserved.</span>
          <span>v{VERSION}</span>
        </div>
      </div>
    </footer>
  </div>
);
