"use client";

import { animate, motion, useInView, useMotionValue } from "motion/react";
import { useEffect, useRef } from "react";

interface StatItemProps {
  value: number;
  label: string;
}

function AnimatedCounter({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      const animation = animate(motionValue, value, {
        duration: 1.5,
        ease: [0.22, 1, 0.36, 1],
        onUpdate: (latest) => {
          if (ref.current) {
            ref.current.textContent = Math.round(latest).toLocaleString();
          }
        },
      });

      return () => animation.stop();
    }
  }, [isInView, motionValue, value]);

  return <span ref={ref}>0</span>;
}

function StatItem({ value, label }: StatItemProps) {
  return (
    <div className="flex flex-col gap-1 text-center">
      <span className="font-bold text-2xl text-primary sm:text-3xl">
        <AnimatedCounter value={value} />
      </span>
      <span className="text-muted-foreground text-sm">{label}</span>
    </div>
  );
}

interface QuickStatsClientProps {
  visits: number;
  posts: number;
  stars: number;
}

export function QuickStatsClient({
  visits,
  posts,
  stars,
}: QuickStatsClientProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex justify-center divide-x divide-border rounded-2xl bg-muted/50 p-6"
    >
      <div className="flex-1 px-4 first:pl-0 last:pr-0">
        <StatItem value={visits} label="Site Visits" />
      </div>
      <div className="flex-1 px-4 first:pl-0 last:pr-0">
        <StatItem value={posts} label="Blog Posts" />
      </div>
      <div className="flex-1 px-4 first:pl-0 last:pr-0">
        <StatItem value={stars} label="GitHub Stars" />
      </div>
    </motion.div>
  );
}
