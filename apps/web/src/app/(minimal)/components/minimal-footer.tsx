import ExternalLink from "@/components/external-link";
import * as Icons from "@/components/icons";
import { VERSION } from "@/config";
import socials from "@/data/socials";

export function MinimalFooter() {
  return (
    <footer className="border-border border-t">
      <div className="container mx-auto flex items-center justify-between px-4 py-6">
        <span className="text-muted text-sm">
          © {new Date().getFullYear()} Ru Chern · v{VERSION}
        </span>
        <div className="flex items-center gap-2">
          {socials.map(({ name, link }) => (
            <ExternalLink
              key={name}
              href={link}
              aria-label={name}
              className="flex size-8 items-center justify-center rounded-full border border-border text-muted transition-colors hover:bg-default hover:text-foreground"
            >
              <Icons.Social name={name} className="size-4" />
            </ExternalLink>
          ))}
        </div>
      </div>
    </footer>
  );
}
