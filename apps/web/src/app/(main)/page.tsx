import { buttonVariants } from "@heroui/styles";
import { format, formatISO } from "date-fns";
import * as motion from "motion/react-client";
import type { Route } from "next";
import Link from "next/link";
import type { WebSite, WithContext } from "schema-dts";
import { StructuredData } from "@/app/components/structured-data";
import { AnnotationRail } from "@/components/annotation-rail";
import ExternalLink from "@/components/external-link";
import { Eyebrow } from "@/components/eyebrow";
import * as Icons from "@/components/icons";
import { StatReadout } from "@/components/stat-readout";
import { BASE_URL } from "@/config";
import projects from "@/data/projects";
import socials from "@/data/socials";
import { getGitHubStars } from "@/lib/github";
import { liveUrl, repoUrl } from "@/lib/links";
import { getTotalVisits } from "@/lib/queries/posthog";
import { getPublishedPosts, getPublishedPostsCount } from "@/lib/queries/posts";

const structuredData: WithContext<WebSite> = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Ru Chern",
  url: BASE_URL,
  description:
    "Personal blog and portfolio of Ru Chern, featuring posts on software development, technology and personal projects.",
  image: [
    {
      "@type": "ImageObject",
      url: `${BASE_URL}/cover-image.png`,
      width: "1200",
      height: "630",
    },
  ],
  sameAs: [
    "https://github.com/ruchernchong",
    "https://www.linkedin.com/in/ruchernchong",
    "https://twitter.com/ruchernchong",
  ],
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};
const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString("en-SG");
}

export default async function HomePage() {
  const [postCount, githubStars, totalVisits, allPosts] = await Promise.all([
    getPublishedPostsCount(),
    getGitHubStars(),
    getTotalVisits(),
    getPublishedPosts(),
  ]);
  const latestPosts = allPosts.slice(0, 3);
  const featured = projects.filter((p) => p.featured);

  return (
    <>
      <StructuredData data={structuredData} />
      <div className="flex flex-col gap-20">
        {/* Hero */}
        <motion.section
          variants={stagger}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-6 pt-8"
        >
          <motion.div variants={fadeUp}>
            <Eyebrow>Software Engineer · Singapore</Eyebrow>
          </motion.div>
          <motion.h1
            variants={fadeUp}
            className="font-display font-semibold text-5xl text-foreground tracking-tight sm:text-6xl"
          >
            Ru Chern
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="max-w-xl text-balance text-lg text-muted leading-relaxed"
          >
            Shipping code by day. Chasing ideas by night.
          </motion.p>

          <motion.dl
            variants={fadeUp}
            className="mt-2 flex flex-wrap gap-x-12 gap-y-6"
          >
            <StatReadout label="Posts" value={postCount} />
            <StatReadout label="GitHub stars" value={compact(githubStars)} />
            <StatReadout label="Page views" value={compact(totalVisits)} />
          </motion.dl>

          <motion.div
            variants={fadeUp}
            className="mt-2 flex items-center gap-3"
          >
            <Link className={buttonVariants()} href="/about">
              About me
            </Link>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/projects"
            >
              Projects
            </Link>
            <span aria-hidden className="mx-1 h-5 w-px bg-border" />
            <div className="flex items-center gap-1">
              {socials.map(({ name, link }) => (
                <ExternalLink
                  key={name}
                  href={link}
                  aria-label={name}
                  className="flex size-9 items-center justify-center rounded-md text-muted hover:bg-default hover:text-foreground"
                >
                  <Icons.Social name={name} className="size-4" />
                </ExternalLink>
              ))}
            </div>
          </motion.div>
        </motion.section>

        {/* Selected work */}
        <section className="flex flex-col gap-6">
          <div className="flex items-baseline justify-between">
            <Eyebrow>Selected work</Eyebrow>
            <Link
              href="/projects"
              className="font-mono text-muted text-xs hover:text-foreground"
            >
              all projects →
            </Link>
          </div>

          <ul className="flex flex-col gap-4">
            {featured.map((project) => {
              const live = liveUrl(project.links);
              const repo = repoUrl(project.links);
              return (
                <li
                  key={project.slug}
                  className="flex flex-col gap-3 rounded-lg border border-border p-5"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="font-display font-medium text-foreground text-xl">
                      {project.name}
                    </h3>
                    <div className="flex shrink-0 items-center gap-3 font-mono text-xs">
                      {live && (
                        <ExternalLink
                          href={live as Route}
                          className="text-accent hover:underline"
                        >
                          live ↗
                        </ExternalLink>
                      )}
                      {repo && (
                        <ExternalLink
                          href={repo as Route}
                          className="text-muted hover:text-foreground"
                        >
                          source ↗
                        </ExternalLink>
                      )}
                    </div>
                  </div>
                  {project.description && (
                    <p className="text-muted text-sm leading-relaxed">
                      {project.description}
                    </p>
                  )}
                  <AnnotationRail>
                    {project.skills.slice(0, 6).map((skill) => (
                      <span key={skill}>{skill}</span>
                    ))}
                  </AnnotationRail>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Latest writing */}
        <section className="flex flex-col gap-6">
          <div className="flex items-baseline justify-between">
            <Eyebrow>Latest writing</Eyebrow>
            <Link
              href="/blog"
              className="font-mono text-muted text-xs hover:text-foreground"
            >
              all posts →
            </Link>
          </div>

          <ul className="flex flex-col">
            {latestPosts.map((post) => (
              <li
                key={post.slug}
                className="border-border border-b last:border-0"
              >
                <Link
                  href={post.metadata.canonical as Route}
                  className="group flex flex-col gap-2 py-5"
                >
                  <h3 className="font-display font-medium text-foreground text-lg group-hover:text-accent">
                    {post.title}
                  </h3>
                  {post.summary && (
                    <p className="line-clamp-2 text-muted text-sm leading-relaxed">
                      {post.summary}
                    </p>
                  )}
                  <AnnotationRail>
                    {post.publishedAt && (
                      <time dateTime={formatISO(post.publishedAt)}>
                        {format(post.publishedAt, "dd MMM yyyy")}
                      </time>
                    )}
                    {post.metadata.readingTime && (
                      <span>{post.metadata.readingTime}</span>
                    )}
                    {post.tags.slice(0, 2).map((tag) => (
                      <span key={tag}>#{tag}</span>
                    ))}
                  </AnnotationRail>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
