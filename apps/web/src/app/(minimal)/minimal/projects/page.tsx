import { cn } from "@heroui/react";
import { SiGithub } from "@icons-pack/react-simple-icons";
import Image from "next/image";
import projects from "@/data/projects";
import type { Project } from "@/types";

function isGitHubLink(url: string): boolean {
  try {
    return new URL(url).hostname === "github.com";
  } catch {
    return false;
  }
}

function ProjectLinks({ links }: { links: Project["links"] }) {
  return (
    <div className="flex gap-2">
      {links.map((link) => {
        const isGitHub = isGitHubLink(link as string);
        return (
          <a
            key={link}
            href={link as string}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 font-medium text-xs transition-colors",
              isGitHub
                ? "border border-border text-muted hover:text-foreground"
                : "bg-foreground text-background hover:opacity-85",
            )}
          >
            {isGitHub && <SiGithub className="size-3" />}
            {isGitHub ? "Source" : "Live"}
          </a>
        );
      })}
    </div>
  );
}

function FeaturedProjectCard({ project }: { project: Project }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <div className="relative h-52 w-full bg-gradient-to-br from-default to-background">
        {project.coverImage && (
          <Image
            fill
            src={project.coverImage}
            alt={project.name}
            className="object-cover"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
        )}
        {!project.coverImage && (
          <div className="flex h-full items-center justify-center">
            <span className="font-semibold text-2xl text-foreground/30">
              {project.name}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3 p-6">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-foreground text-lg">{project.name}</h3>
          <span className="rounded-full border border-border px-2.5 py-0.5 font-medium text-accent text-xs">
            Featured
          </span>
        </div>
        {project.description && (
          <p className="text-muted text-sm leading-relaxed">
            {project.description}
          </p>
        )}
        <div className="flex flex-wrap gap-1.5">
          {project.skills.map((skill) => (
            <span
              key={skill}
              className="rounded-full border border-border px-2.5 py-0.5 text-muted text-xs"
            >
              {skill}
            </span>
          ))}
        </div>
        <ProjectLinks links={project.links} />
      </div>
    </div>
  );
}

function ArchiveProjectCard({ project }: { project: Project }) {
  const displayedSkills = project.skills.slice(0, 4);
  const remaining = project.skills.length - 4;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border p-5 transition-colors hover:bg-default">
      <h3 className="font-semibold text-foreground">{project.name}</h3>
      {project.description && (
        <p className="line-clamp-2 text-muted text-sm leading-relaxed">
          {project.description}
        </p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {displayedSkills.map((skill) => (
          <span
            key={skill}
            className="rounded-full border border-border px-2.5 py-0.5 text-muted text-xs"
          >
            {skill}
          </span>
        ))}
        {remaining > 0 && (
          <span className="rounded-full border border-border px-2.5 py-0.5 text-muted text-xs">
            +{remaining}
          </span>
        )}
      </div>
      <ProjectLinks links={project.links} />
    </div>
  );
}

export default function MinimalProjectsPage() {
  const featuredProjects = projects.filter((p) => p.featured);
  const otherProjects = projects.filter((p) => !p.featured);

  return (
    <div className="flex flex-col gap-16 py-8">
      <div className="flex flex-col gap-3">
        <h1 className="font-bold text-4xl text-foreground tracking-tight md:text-5xl">
          Work.
        </h1>
        <p className="max-w-xl text-lg text-muted leading-relaxed">
          A showcase of completed projects and experiments with new
          technologies.
        </p>
      </div>

      {featuredProjects.length > 0 && (
        <section className="flex flex-col gap-6">
          <h2 className="font-semibold text-muted text-sm uppercase tracking-widest">
            Featured
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {featuredProjects.map((project) => (
              <FeaturedProjectCard key={project.slug} project={project} />
            ))}
          </div>
        </section>
      )}

      {otherProjects.length > 0 && (
        <section className="flex flex-col gap-6">
          <h2 className="font-semibold text-muted text-sm uppercase tracking-widest">
            Archive
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {otherProjects.map((project) => (
              <ArchiveProjectCard key={project.slug} project={project} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
