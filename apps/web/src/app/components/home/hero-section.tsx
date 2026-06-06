import { buttonVariants } from "@heroui/styles";
import { KPI, KPIGroup, TrendChip, Widget } from "@heroui-pro/react";
import {
  AnalyticsUpIcon,
  CodeIcon,
  Notebook02Icon,
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

const sparklineUp = [
  { value: 18 },
  { value: 26 },
  { value: 21 },
  { value: 35 },
  { value: 32 },
  { value: 48 },
  { value: 52 },
  { value: 61 },
];

const sparklineFlat = [
  { value: 32 },
  { value: 34 },
  { value: 31 },
  { value: 35 },
  { value: 33 },
  { value: 36 },
  { value: 34 },
  { value: 37 },
];

export function HeroSection() {
  return (
    <motion.section
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-8"
    >
      <motion.div variants={item}>
        <Widget className="overflow-hidden border border-border/70 bg-surface/70 backdrop-blur-xl">
          <Widget.Content className="relative overflow-hidden p-8 md:p-12">
            <div className="absolute -top-20 -right-20 size-64 rounded-full bg-accent/15 blur-3xl" />
            <div className="absolute -bottom-24 -left-16 size-56 rounded-full bg-accent/10 blur-3xl" />

            <div className="relative flex flex-col gap-8">
              <div className="flex flex-col gap-4">
                <div className="size-3 rounded-full bg-accent shadow-[0_0_24px_oklch(0.60_0.18_25/0.45)]" />
                <div className="flex flex-col gap-3">
                  <h1 className="max-w-3xl font-bold text-5xl text-foreground tracking-tight sm:text-6xl lg:text-7xl">
                    Ru Chern
                  </h1>
                  <p className="font-medium text-2xl text-muted tracking-tight sm:text-3xl">
                    Software Engineer
                  </p>
                  <p className="max-w-2xl text-lg text-muted leading-relaxed">
                    Shipping pragmatic software, writing about the details, and
                    keeping a few small dashboards honest.
                  </p>
                </div>
              </div>

              <KPIGroup className="grid gap-4 bg-transparent shadow-none md:grid-cols-3">
                <KPI>
                  <KPI.Header>
                    <KPI.Icon status="success">
                      <HugeiconsIcon icon={Notebook02Icon} size={18} />
                    </KPI.Icon>
                    <KPI.Title>Writing</KPI.Title>
                  </KPI.Header>
                  <KPI.Content className="grid-cols-[1fr_1fr] items-end">
                    <div className="flex flex-col gap-2">
                      <KPI.Value className="text-4xl" value={24} />
                      <TrendChip trend="up" variant="tertiary">
                        active
                      </TrendChip>
                    </div>
                    <KPI.Chart
                      color="var(--color-accent)"
                      data={sparklineUp}
                      height={64}
                    />
                  </KPI.Content>
                </KPI>
                <KPI>
                  <KPI.Header>
                    <KPI.Icon status="warning">
                      <HugeiconsIcon icon={CodeIcon} size={18} />
                    </KPI.Icon>
                    <KPI.Title>Projects</KPI.Title>
                  </KPI.Header>
                  <KPI.Content className="grid-cols-[1fr_1fr] items-end">
                    <div className="flex flex-col gap-2">
                      <KPI.Value className="text-4xl" value={12} />
                      <TrendChip trend="neutral" variant="tertiary">
                        curated
                      </TrendChip>
                    </div>
                    <KPI.Chart
                      color="var(--chart-4)"
                      data={sparklineFlat}
                      height={64}
                    />
                  </KPI.Content>
                </KPI>
                <KPI>
                  <KPI.Header>
                    <KPI.Icon status="success">
                      <HugeiconsIcon icon={AnalyticsUpIcon} size={18} />
                    </KPI.Icon>
                    <KPI.Title>Analytics</KPI.Title>
                  </KPI.Header>
                  <KPI.Content className="grid-cols-[1fr_1fr] items-end">
                    <div className="flex flex-col gap-2">
                      <KPI.Value
                        className="text-4xl"
                        notation="compact"
                        value={125_400}
                      />
                      <TrendChip trend="up" variant="tertiary">
                        tracked
                      </TrendChip>
                    </div>
                    <KPI.Chart
                      color="var(--color-success)"
                      data={sparklineUp}
                      height={64}
                    />
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
          </Widget.Content>
        </Widget>
      </motion.div>
    </motion.section>
  );
}
