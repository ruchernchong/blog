import { buttonVariants } from "@heroui/styles";
import { KPI, KPIGroup, TrendChip } from "@heroui-pro/react";
import {
  AnalyticsUpIcon,
  Notebook02Icon,
  StarIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import * as motion from "motion/react-client";
import ExternalLink from "@/components/external-link";
import * as Icons from "@/components/icons";
import socials from "@/data/socials";

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
                Shipping code by day. Chasing ideas by night. 🚀💡
              </p>
            </div>
          </div>

          <KPIGroup>
            <KPI>
              <KPI.Header>
                <KPI.Icon status="success">
                  <HugeiconsIcon icon={Notebook02Icon} size={18} />
                </KPI.Icon>
                <KPI.Title>Writing</KPI.Title>
              </KPI.Header>
              <KPI.Content>
                <div className="flex flex-col gap-2">
                  <KPI.Value className="text-4xl" value={postCount} />
                  <TrendChip trend="up" variant="tertiary">
                    published
                  </TrendChip>
                </div>
              </KPI.Content>
            </KPI>
            <KPIGroup.Separator />
            <KPI>
              <KPI.Header>
                <KPI.Icon status="warning">
                  <HugeiconsIcon icon={StarIcon} size={18} />
                </KPI.Icon>
                <KPI.Title>GitHub Stars</KPI.Title>
              </KPI.Header>
              <KPI.Content>
                <div className="flex flex-col gap-2">
                  <KPI.Value className="text-4xl" value={githubStars} />
                  <TrendChip trend="up" variant="tertiary">
                    across repos
                  </TrendChip>
                </div>
              </KPI.Content>
            </KPI>
            <KPIGroup.Separator />
            <KPI>
              <KPI.Header>
                <KPI.Icon status="success">
                  <HugeiconsIcon icon={AnalyticsUpIcon} size={18} />
                </KPI.Icon>
                <KPI.Title>Page Views</KPI.Title>
              </KPI.Header>
              <KPI.Content>
                <div className="flex flex-col gap-2">
                  <KPI.Value
                    className="text-4xl"
                    notation="compact"
                    value={totalVisits}
                  />
                  <TrendChip trend="up" variant="tertiary">
                    tracked
                  </TrendChip>
                </div>
              </KPI.Content>
            </KPI>
          </KPIGroup>

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
