import Link from "next/link";
import { LogoMark } from "@/components/logo-mark";

export function HomeHero() {
  return (
    <section className="flex flex-col gap-6">
      <LogoMark size={68} />
      <h1 className="font-bold text-3xl leading-tight tracking-tighter sm:text-4xl">
        Hey, I'm Ru Chern.
        <br />
        Dev by day,{" "}
        <span className="inline-block origin-left whitespace-nowrap text-accent sm:motion-safe:animate-dangle-sway">
          dreamer by night
        </span>
      </h1>
      <p className="max-w-md text-muted leading-relaxed">
        Shipping code by day, chasing ideas by night.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/blog"
          className="rounded-full bg-foreground px-6 py-3 font-semibold text-background text-sm transition-opacity hover:opacity-85"
        >
          Read the Blog
        </Link>
        <span className="inline-flex items-center gap-2 rounded-full bg-success/10 px-5 py-3 font-medium text-[color-mix(in_oklab,var(--success)_60%,var(--foreground))] text-sm">
          <span className="size-2 rounded-full bg-success motion-safe:animate-status-pulse" />
          Currently prompting
        </span>
      </div>
    </section>
  );
}
