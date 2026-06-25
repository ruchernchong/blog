import { buttonVariants } from "@heroui/styles";
import * as motion from "motion/react-client";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-6"
      >
        <span className="font-mono text-accent text-sm uppercase tracking-wide">
          :: HTTP 404
        </span>
        <h1 className="font-display font-semibold text-5xl text-foreground tracking-tight sm:text-6xl">
          Page not found
        </h1>
        <p className="max-w-md text-muted leading-relaxed">
          This route does not resolve. The page may have moved, or it never
          existed. Let&apos;s get you back on track.
        </p>
        <div className="mt-2 flex items-center gap-3">
          <Link className={buttonVariants()} href="/">
            Return home
          </Link>
          <Link className={buttonVariants({ variant: "outline" })} href="/blog">
            Read the blog
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
