import { Button, Chip } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { ItemCard, ItemCardGroup } from "@heroui-pro/react";
import { ArrowRight01Icon, CodeIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import * as motion from "motion/react-client";
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
      className="h-full"
    >
      <ItemCard className="h-full">
        <ItemCard.Icon>
          <HugeiconsIcon icon={CodeIcon} size={18} />
        </ItemCard.Icon>
        <ItemCard.Content>
          <ItemCard.Title>{project.name}</ItemCard.Title>
          {project.description && (
            <ItemCard.Description className="line-clamp-3">
              {project.description}
            </ItemCard.Description>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {project.skills.slice(0, 4).map((skill) => (
              <Chip color="accent" key={skill} size="sm" variant="soft">
                {skill}
              </Chip>
            ))}
            {project.skills.length > 4 && (
              <Chip size="sm" variant="soft">
                +{project.skills.length - 4}
              </Chip>
            )}
          </div>
          <div className="mt-4 flex gap-2">
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
        </ItemCard.Content>
        <ItemCard.Action>
          <Button
            isIconOnly
            aria-label={`Open ${project.name}`}
            size="sm"
            variant="outline"
          >
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
          </Button>
        </ItemCard.Action>
      </ItemCard>
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
      <ItemCardGroup.Header className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <Typography variant="label" className="text-accent">
            Featured Work
          </Typography>
          <Typography variant="h2">Selected Projects</Typography>
        </div>
        <Link
          className={buttonVariants({ variant: "ghost", size: "sm" })}
          href="/projects"
        >
          View All
        </Link>
      </ItemCardGroup.Header>

      <ItemCardGroup columns={2} layout="grid">
        {featuredProjects.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </ItemCardGroup>
    </motion.section>
  );
}
