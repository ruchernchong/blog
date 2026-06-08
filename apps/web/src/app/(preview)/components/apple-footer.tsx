import { Separator } from "@heroui/react";
import type { Route } from "next";
import Link from "next/link";
import ExternalLink from "@/components/external-link";
import * as Icons from "@/components/icons";
import { Logo } from "@/components/logo";
import { navLinks, VERSION } from "@/config";
import socials from "@/data/socials";

export function AppleFooter() {
  return (
    <footer className="border-border/50 border-t bg-background">
      <div className="container mx-auto px-6 py-12 md:py-16">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="flex max-w-sm flex-col gap-3">
            <Logo />
            <p className="text-muted text-sm leading-relaxed">
              Personal writing, project notes, and small dashboards from a
              software engineer in Singapore.
            </p>
          </div>
          <div className="flex gap-8 md:gap-12">
            <nav aria-label="Footer navigation" className="flex flex-col gap-3">
              <Link
                href="/preview"
                className="font-medium text-muted text-sm transition-colors hover:text-accent"
              >
                Home
              </Link>
              {navLinks.map(({ href, title }) => (
                <Link
                  key={title}
                  href={`/preview${href}` as Route}
                  className="font-medium text-muted text-sm transition-colors hover:text-accent"
                >
                  {title}
                </Link>
              ))}
            </nav>
            <div className="flex flex-col gap-3">
              {socials.map(({ name, link }) => (
                <ExternalLink
                  key={name}
                  href={link}
                  className="font-medium text-muted text-sm transition-colors hover:text-accent"
                >
                  <span className="inline-flex items-center gap-2">
                    <Icons.Social name={name} className="h-4 w-4" />
                    {name}
                  </span>
                </ExternalLink>
              ))}
            </div>
          </div>
        </div>
        <Separator className="my-8" />
        <div className="text-muted text-sm md:text-right">
          <span>v{VERSION}</span>
        </div>
      </div>
    </footer>
  );
}
