"use client";

import { animate, useInView, useMotionValue } from "motion/react";
import { useEffect, useRef } from "react";
import { formatStat } from "@/lib/format-stat";

interface AnimatedCounterProps {
  value: number;
  /** Format with k/M/B suffixes (e.g. 48.2k) instead of a plain locale number. */
  compact?: boolean;
}

const defaultFormat = (value: number) => Math.round(value).toLocaleString();

export function AnimatedCounter({
  value,
  compact = false,
}: AnimatedCounterProps) {
  const format = compact ? formatStat : defaultFormat;
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
            ref.current.textContent = format(latest);
          }
        },
      });

      return () => animation.stop();
    }
  }, [isInView, motionValue, value, format]);

  return <span ref={ref}>{format(0)}</span>;
}
