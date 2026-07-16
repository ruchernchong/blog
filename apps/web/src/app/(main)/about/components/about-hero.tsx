import { LogoMark } from "@/components/logo-mark";
import socials from "@/data/socials";

const SOCIAL_LABELS: Record<string, string> = {
  Github: "GitHub",
  Linkedin: "LinkedIn",
  Twitter: "Twitter",
};

interface AboutHeroProps {
  intro: string;
}

export function AboutHero({ intro }: AboutHeroProps) {
  return (
    <div className="grid grid-cols-1 items-start gap-9 sm:grid-cols-[1fr_148px]">
      <div className="flex flex-col gap-4">
        <span className="font-mono font-semibold text-accent text-xs uppercase tracking-widest">
          About
        </span>
        <h1 className="font-bold text-4xl tracking-tighter">Ru Chern</h1>
        <p className="text-muted leading-relaxed">{intro}</p>
        <div className="flex flex-wrap gap-5">
          {socials.map(({ name, link }) => (
            <a
              key={name}
              href={link}
              target="_blank"
              rel="noreferrer nofollow me"
              className="font-medium text-muted text-sm underline underline-offset-4 hover:text-foreground"
            >
              {SOCIAL_LABELS[name] ?? name}
            </a>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="grid size-33 place-items-center rounded-full border-2 border-accent bg-foreground">
          <LogoMark size={64} />
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-success motion-safe:animate-status-pulse" />
          <span className="font-mono text-muted text-xs">SGT · GMT+8</span>
        </div>
      </div>
    </div>
  );
}
