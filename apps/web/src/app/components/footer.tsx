import { cacheLife } from "next/cache";
import { SgtClock } from "@/app/components/sgt-clock";
import ExternalLink from "@/components/external-link";
import socials from "@/data/socials";

const footerLinks = [
  ...socials.map(({ name, link }) => ({
    name:
      name === "Github" ? "GitHub" : name === "Linkedin" ? "LinkedIn" : name,
    link,
  })),
  { name: "Email", link: "mailto:ruchern.chong@gmail.com" },
];

export async function Footer() {
  "use cache";
  cacheLife("days");

  const year = new Date().getFullYear();

  return (
    <div className="flex justify-center px-4 pb-12">
      <footer className="flex w-full max-w-[680px] flex-col gap-8 border-separator border-t pt-10">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-accent text-xs tracking-wide">
            {"// end of file"}
          </span>
          <h2 className="font-semibold text-2xl tracking-tight">
            Thanks for scrolling all the way down.
          </h2>
          <p className="text-muted text-sm leading-relaxed">
            Written after midnight, somewhere in Singapore.
          </p>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-4">
              {footerLinks.map(({ name, link }) => (
                <ExternalLink
                  key={name}
                  href={link}
                  className="font-medium text-foreground text-sm underline-offset-3 hover:underline"
                >
                  {name}
                </ExternalLink>
              ))}
            </div>
            <span className="text-muted text-sm">
              Ru Chern · Developer & Writer · {year}
            </span>
          </div>

          <SgtClock />
        </div>
      </footer>
    </div>
  );
}
