import { Suspense } from "react";
import { AnnotationRail } from "@/components/annotation-rail";
import ExternalLink from "@/components/external-link";
import * as Icons from "@/components/icons";
import { VERSION } from "@/config";
import socials from "@/data/socials";
import { CurrentYear } from "./current-year";

export function Footer() {
  return (
    <footer className="border-border border-t">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-4 px-4 py-8 sm:flex-row sm:items-center">
        <AnnotationRail>
          <span>
            ©{" "}
            <Suspense fallback={null}>
              <CurrentYear />
            </Suspense>{" "}
            Ru Chern
          </span>
          <span>v{VERSION}</span>
        </AnnotationRail>

        <div className="flex items-center gap-1">
          {socials.map(({ name, link }) => (
            <ExternalLink
              key={name}
              href={link}
              aria-label={name}
              className="flex size-9 items-center justify-center rounded-md text-muted hover:bg-default hover:text-foreground"
            >
              <Icons.Social name={name} className="size-4" />
            </ExternalLink>
          ))}
        </div>
      </div>
    </footer>
  );
}
