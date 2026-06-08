import { buttonVariants } from "@heroui/styles";
import * as motion from "motion/react-client";
import ExternalLink from "@/components/external-link";
import * as Icons from "@/components/icons";
import socials from "@/data/socials";
import { AppleStat } from "./apple-stat";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

interface AppleHeroSectionProps {
  postCount: number;
  githubStars: number;
  totalVisits: number;
}

function formatCompact(n: number) {
  return new Intl.NumberFormat("en", { notation: "compact" }).format(n);
}

export function AppleHeroSection({
  postCount,
  githubStars,
  totalVisits,
}: AppleHeroSectionProps) {
  return (
    <motion.section
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-12"
    >
      <motion.div variants={item}>
        <div className="flex flex-col gap-8 py-16 md:py-24">
          <div className="flex flex-col gap-4">
            <div className="size-3 rounded-full bg-accent shadow-[0_0_24px_oklch(0.50_0.20_255/0.45)]" />
            <div className="flex flex-col gap-3">
              <h1 className="max-w-3xl font-semibold text-6xl text-foreground tracking-tighter sm:text-7xl lg:text-8xl">
                Ru Chern
              </h1>
              <p className="font-medium text-2xl text-muted tracking-tight sm:text-3xl">
                Software Engineer
              </p>
              <p className="max-w-2xl text-lg text-muted leading-relaxed">
                Shipping code by day. Chasing ideas by night.
              </p>
            </div>
          </div>

          <div className="flex items-end gap-8 md:gap-12">
            <AppleStat value={postCount} label="Articles" />
            <span className="select-none pb-5 text-2xl text-border" aria-hidden>
              ·
            </span>
            <AppleStat value={githubStars} label="GitHub Stars" />
            <span className="select-none pb-5 text-2xl text-border" aria-hidden>
              ·
            </span>
            <AppleStat value={formatCompact(totalVisits)} label="Page Views" />
          </div>

          <div className="flex flex-wrap gap-3">
            {socials.map(({ name, link }) => (
              <ExternalLink
                aria-label={name}
                className={`${buttonVariants({ variant: "outline" })} size-10 p-0`}
                href={link}
                key={name}
              >
                <Icons.Social name={name} className="size-5" />
              </ExternalLink>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
}
