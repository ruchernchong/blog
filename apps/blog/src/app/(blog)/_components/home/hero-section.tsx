"use client";

import { motion } from "motion/react";
import ExternalLink from "@/components/shared/external-link";
import * as Icons from "@/components/shared/icons";
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

export function HeroSection() {
  return (
    <motion.section
      variants={container}
      initial="hidden"
      animate="show"
      className="flex min-h-[60vh] flex-col justify-center gap-6"
    >
      {/* Decorative coral accent */}
      <motion.div
        variants={item}
        className="size-3 rounded-full bg-primary"
        style={{ boxShadow: "0 0 20px oklch(0.60 0.18 25 / 0.5)" }}
      />

      {/* Name */}
      <motion.h1
        variants={item}
        className="font-bold text-5xl tracking-tight sm:text-6xl lg:text-7xl"
      >
        Ru Chern
      </motion.h1>

      {/* Role */}
      <motion.p
        variants={item}
        className="font-medium text-2xl text-muted-foreground tracking-tight sm:text-3xl"
      >
        Software Engineer
      </motion.p>

      {/* Tagline */}
      <motion.p variants={item} className="text-lg text-muted-foreground">
        Shipping code by day. Chasing ideas by night. 🚀💡
      </motion.p>

      {/* Social Links */}
      <motion.div variants={item} className="flex gap-4">
        {socials.map(({ name, link }) => (
          <ExternalLink
            key={name}
            href={link}
            className="rounded-full bg-muted p-3 text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary hover:text-primary-foreground"
          >
            <Icons.Social name={name} className="size-5" />
          </ExternalLink>
        ))}
      </motion.div>
    </motion.section>
  );
}
