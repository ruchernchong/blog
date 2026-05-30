"use client";

import { Chip } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { motion } from "motion/react";
import type { Route } from "next";
import Link from "next/link";
import { Typography } from "@/components/typography";
import type { Project } from "@/types";

interface FeaturedWorkProps {
  projects: Project[];
}

function isGitHubUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === "github.com" || hostname.endsWith(".github.com");
  } catch {
    return false;
  }
}

function ProjectCard({ project }: { project: Project }) {
  const liveUrl = project.links.find((link) => !isGitHubUrl(link)) as Route;
  const githubUrl = project.links.find((link) => isGitHubUrl(link)) as Route;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group flex flex-col gap-4 rounded-2xl bg-default/50 p-6"
    >
      <div className="flex flex-col gap-2">
        <h3 className="font-semibold text-xl">{project.name}</h3>
        {project.description && (
          <p className="text-muted text-sm leading-relaxed">
            {project.description}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {project.skills.slice(0, 4).map((skill) => (
          <Chip key={skill} size="sm" variant="secondary">
            {skill}
          </Chip>
        ))}
        {project.skills.length > 4 && (
          <Chip size="sm" variant="secondary">
            +{project.skills.length - 4}
          </Chip>
        )}
      </div>

      <div className="mt-auto flex gap-2">
        {liveUrl && (
          <Link className={buttonVariants({ size: "sm" })} href={liveUrl}>
            View Live
          </Link>
        )}
        {githubUrl && (
          <Link
            className={buttonVariants({ variant: "outline", size: "sm" })}
            href={githubUrl}
          >
            GitHub
          </Link>
        )}
      </div>
    </motion.div>
  );
}

export function FeaturedWork({ projects }: FeaturedWorkProps) {
  const featuredProjects = projects.filter((p) => p.featured).slice(0, 2);

  if (featuredProjects.length === 0) {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-6"
    >
      <div className="flex items-center justify-between">
        <Typography variant="label" className="text-foreground">
          Featured Work
        </Typography>
        <Link
          className={buttonVariants({ variant: "ghost", size: "sm" })}
          href="/projects"
        >
          View All
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {featuredProjects.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
    </motion.section>
  );
}
