import Image from "next/image";
import Link from "next/link";
import ExternalLink from "@/components/external-link";
import * as Icons from "@/components/icons";
import socials from "@/data/socials";

interface MinimalHeroSectionProps {
  postCount: number;
  githubStars: number;
  totalVisits: number;
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString("en-SG");
}

export function MinimalHeroSection({
  postCount,
  githubStars,
  totalVisits,
}: MinimalHeroSectionProps) {
  return (
    <section className="flex flex-col gap-10 py-12 md:py-20">
      <div className="flex flex-col gap-6">
        <div className="size-20 overflow-hidden rounded-full border-2 border-border shadow-sm">
          <Image
            src="/icon"
            alt="Ru Chern"
            width={80}
            height={80}
            priority
            quality={100}
            className="size-full object-cover"
          />
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="max-w-2xl font-bold text-4xl text-foreground tracking-tight md:text-5xl">
            Hey, I&apos;m Ru Chern.
            <br />
            Engineer &amp; ✦ Builder.
          </h1>
          <p className="max-w-xl text-lg text-muted leading-relaxed">
            Shipping web applications by day. Chasing ideas by night. 🚀
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/minimal/about"
          className="inline-flex items-center rounded-full bg-foreground px-5 py-2.5 font-medium text-background text-sm transition-opacity hover:opacity-85"
        >
          About Me
        </Link>
        <div className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-muted text-sm">
          <span className="size-2 animate-pulse rounded-full bg-success" />
          Open to opportunities
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-muted text-sm">
        <span>{postCount} posts written</span>
        <span className="select-none text-border">·</span>
        <span>{githubStars.toLocaleString("en-SG")} GitHub stars</span>
        <span className="select-none text-border">·</span>
        <span>{formatCompact(totalVisits)} page views</span>
      </div>

      <div className="flex gap-2">
        {socials.map(({ name, link }) => (
          <ExternalLink
            key={name}
            href={link}
            aria-label={name}
            className="flex size-10 items-center justify-center rounded-full border border-border text-muted transition-colors hover:bg-default hover:text-foreground"
          >
            <Icons.Social name={name} className="size-4" />
          </ExternalLink>
        ))}
      </div>
    </section>
  );
}
