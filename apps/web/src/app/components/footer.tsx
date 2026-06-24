import { buttonVariants } from "@heroui/styles";
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
      <div className="container mx-auto flex flex-col items-start justify-between gap-4 px-4 py-8 sm:flex-row sm:items-center">
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
              className={buttonVariants({
                variant: "ghost",
                size: "sm",
                isIconOnly: true,
              })}
            >
              <Icons.Social name={name} className="size-4" />
            </ExternalLink>
          ))}
        </div>
      </div>
    </footer>
  );
}
