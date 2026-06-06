import { Chip, cn } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { ItemCard, Widget } from "@heroui-pro/react";
import { CodeIcon, LinkSquare01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { SiGithub } from "@icons-pack/react-simple-icons";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import globalMetadata from "@/app/metadata";
import { PageTitle } from "@/components/page-title";
import projects from "@/data/projects";
import type { Project } from "@/types";

const title = "Projects";
const description =
  "A showcase of completed projects and experiments with new technologies.";
const canonical = "/projects";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    ...globalMetadata.openGraph,
    title,
    description,
    url: canonical,
  },
  twitter: {
    ...globalMetadata.twitter,
    title,
    description,
  },
  alternates: {
    canonical,
  },
};

function isGitHubLink(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === "github.com" ||
      parsed.hostname.endsWith(".github.com")
    );
  } catch {
    return false;
  }
}

function ProjectCard({
  project,
  featured = false,
}: {
  project: Project;
  featured?: boolean;
}) {
  const displayedSkills = project.skills.slice(0, 4);
  const remainingCount = project.skills.length - 4;

  if (featured) {
    return (
      <Widget>
        <Widget.Header>
          <Widget.Title>{project.name}</Widget.Title>
          <Chip color="accent" variant="soft">
            Featured
          </Chip>
        </Widget.Header>
        <Widget.Content className="flex flex-col gap-5">
          {project.description && (
            <p className="text-muted text-sm">{project.description}</p>
          )}
          <div className="relative h-48 w-full overflow-hidden rounded-2xl border border-border/70">
            <Image
              fill
              loading="eager"
              sizes="(min-width: 768px) 50vw, 100vw"
              src={
                project.coverImage ??
                "https://images.unsplash.com/photo-1505238680356-667803448bb6?w=800&h=450&fit=crop"
              }
              alt={project.name}
              className="object-cover transition-transform duration-200 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/75 to-transparent" />
          </div>

          <div className="flex flex-wrap gap-2">
            {project.skills.map((skill) => (
              <Chip key={skill} color="accent" size="sm" variant="soft">
                {skill}
              </Chip>
            ))}
          </div>

          <div className="flex gap-2">
            {project.links.map((link) => (
              <Link
                key={link}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({
                  size: "sm",
                  variant: isGitHubLink(link) ? "outline" : "primary",
                })}
              >
                {isGitHubLink(link) ? (
                  <SiGithub className="size-4" />
                ) : (
                  <HugeiconsIcon
                    icon={LinkSquare01Icon}
                    size={16}
                    strokeWidth={2}
                  />
                )}
                {isGitHubLink(link) ? "Source" : "Live"}
              </Link>
            ))}
          </div>
        </Widget.Content>
      </Widget>
    );
  }

  return (
    <ItemCard
      className={cn(
        "h-full transition-all duration-200 hover:-translate-y-0.5",
        "hover:shadow-[0_8px_30px_-10px_oklch(0_0_0/0.08)]",
      )}
    >
      <ItemCard.Icon className="hidden sm:flex">
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
          {displayedSkills.map((skill) => (
            <Chip key={skill} color="accent" size="sm" variant="soft">
              {skill}
            </Chip>
          ))}
          {remainingCount > 0 && (
            <Chip size="sm" variant="soft">
              +{remainingCount}
            </Chip>
          )}
        </div>
        <div className="mt-4 flex gap-2">
          {project.links.map((link) => {
            return (
              <Link
                key={link}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({
                  size: "sm",
                  variant: isGitHubLink(link) ? "outline" : "primary",
                })}
              >
                {isGitHubLink(link) ? (
                  <SiGithub className="size-4" />
                ) : (
                  <HugeiconsIcon
                    icon={LinkSquare01Icon}
                    size={16}
                    strokeWidth={2}
                  />
                )}
                {isGitHubLink(link) ? "Source" : "Live"}
              </Link>
            );
          })}
        </div>
      </ItemCard.Content>
    </ItemCard>
  );
}

export default function ProjectsPage() {
  const featuredProjects = projects.filter((project) => project.featured);
  const otherProjects = projects.filter((project) => !project.featured);

  return (
    <div className="flex flex-col gap-8">
      <PageTitle
        title="Projects"
        description="A showcase of completed projects and experiments with new technologies."
        icon={
          <div className="flex size-10 items-center justify-center rounded-xl bg-accent/10">
            <HugeiconsIcon icon={CodeIcon} size={20} className="text-accent" />
          </div>
        }
      />

      {featuredProjects.length > 0 && (
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <span className="font-medium text-accent text-sm">Featured</span>
            <h2 className="font-semibold text-3xl text-foreground tracking-tight">
              Work Worth Opening
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {featuredProjects.map((project) => (
              <ProjectCard key={project.slug} project={project} featured />
            ))}
          </div>
        </section>
      )}

      {otherProjects.length > 0 && (
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <span className="font-medium text-accent text-sm">Archive</span>
            <h2 className="font-semibold text-3xl text-foreground tracking-tight">
              More Projects
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {otherProjects.map((project) => {
              return <ProjectCard key={project.slug} project={project} />;
            })}
          </div>
        </section>
      )}
    </div>
  );
}
