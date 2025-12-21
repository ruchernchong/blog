"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { BackgroundEffects } from "@/components/background-effects";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <BackgroundEffects />
      <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-4">
        {/* Large 404 */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="select-none text-[clamp(8rem,25vw,14rem)] font-bold leading-none tracking-tighter text-primary"
        >
          404
        </motion.h1>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <p className="text-xl font-medium tracking-tight text-foreground">
            This page has wandered off
          </p>
          <p className="max-w-md text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist, or perhaps it
            never did. Either way, let&apos;s get you back on track.
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
          className="flex gap-4"
        >
          <Button
            nativeButton={false}
            render={<Link href="/" />}
            className="transition-all duration-200 hover:scale-[1.02]"
            style={{
              boxShadow: "0 8px 30px -10px oklch(0.60 0.18 25 / 0.4)",
            }}
          >
            Return Home
          </Button>
          <Button
            nativeButton={false}
            render={<Link href="/blog" />}
            variant="outline"
            className="transition-all duration-200 hover:scale-[1.02]"
          >
            Read the Blog
          </Button>
        </motion.div>

        {/* Decorative line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
          className="h-px w-32 bg-gradient-to-r from-transparent via-primary/40 to-transparent"
        />
      </main>
    </>
  );
}
