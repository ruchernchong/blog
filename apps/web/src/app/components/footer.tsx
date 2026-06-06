import { Separator } from "@heroui/react";
import Link from "next/link";
import ExternalLink from "@/components/external-link";
import * as Icons from "@/components/icons";
import { Logo } from "@/components/logo";
import { navLinks, VERSION } from "@/config";
import socials from "@/data/socials";

export function Footer() {
  return (
    <div className="container mx-auto flex justify-center px-4 pb-8">
      <footer className="w-full rounded-2xl border border-border/70 bg-surface/80 p-6 shadow-surface backdrop-blur-xl md:p-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div className="flex max-w-sm flex-col gap-3">
              <Logo />
              <p className="text-muted text-sm leading-relaxed">
                Personal writing, project notes, and small dashboards from a
                software engineer in Singapore.
              </p>
            </div>
            <div className="flex gap-8 md:gap-12">
              <nav
                aria-label="Footer navigation"
                className="flex flex-col gap-3"
              >
                <Link
                  href="/"
                  className="font-medium text-muted text-sm transition-colors hover:text-accent"
                >
                  Home
                </Link>
                {navLinks.map(({ href, title }) => {
                  return (
                    <Link
                      key={title}
                      href={href}
                      className="font-medium text-muted text-sm transition-colors hover:text-accent"
                    >
                      {title}
                    </Link>
                  );
                })}
              </nav>
              <div className="flex flex-col gap-3">
                {socials.map(({ name, link }) => (
                  <div key={name}>
                    <ExternalLink
                      href={link}
                      className="font-medium text-muted text-sm transition-colors hover:text-accent"
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
          <Separator />
          <div className="text-muted text-sm md:text-right">
            <span>v{VERSION}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
