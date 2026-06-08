import type { Route } from "next";
import Link from "next/link";
import ExternalLink from "@/components/external-link";
import type { Project } from "@/types";

const TILE_GRADIENTS = [
  "from-[oklch(0.82_0.12_255)] to-[oklch(0.58_0.22_255)]",
  "from-[oklch(0.82_0.12_240)] to-[oklch(0.58_0.18_240)]",
  "from-[oklch(0.82_0.08_270)] to-[oklch(0.63_0.14_270)]",
];

interface AppleFeaturedWorkProps {
  projects: Project[];
}

export function AppleFeaturedWork({ projects }: AppleFeaturedWorkProps) {
  return (
    <section className="border-border/50 border-t py-12">
      <div className="mb-10 flex items-baseline justify-between">
        <h2 className="font-semibold text-4xl tracking-tight">Selected Work</h2>
        <Link
          href={"/preview/projects" as Route}
          className="text-muted text-sm transition-colors hover:text-accent"
        >
          See all →
        </Link>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {projects.map((project, index) => (
          <AppleProjectCard
            key={project.slug}
            project={project}
            gradientClass={TILE_GRADIENTS[index % TILE_GRADIENTS.length]}
          />
        ))}
      </div>
    </section>
  );
}

interface AppleProjectCardProps {
  project: Project;
  gradientClass: string;
}

function AppleProjectCard({ project, gradientClass }: AppleProjectCardProps) {
  const liveUrl = project.links[0];
  const githubUrl = project.links[1];

  return (
    <div className="overflow-hidden rounded-2xl bg-surface shadow-[var(--surface-shadow)]">
      <div className={`h-40 bg-gradient-to-br ${gradientClass}`} />
      <div className="p-7">
        <h3 className="font-semibold text-lg tracking-tight">{project.name}</h3>
        <p className="mt-2 mb-3 line-clamp-2 text-muted text-sm leading-relaxed">
          {project.description}
        </p>
        <p className="mb-5 text-muted/60 text-xs">
          {project.skills.join(" · ")}
        </p>
        <div className="flex gap-4">
          {liveUrl && (
            <ExternalLink
              href={liveUrl}
              className="font-medium text-accent text-sm hover:underline"
            >
              Live ↗
            </ExternalLink>
          )}
          {githubUrl && (
            <ExternalLink
              href={githubUrl}
              className="text-muted text-sm transition-colors hover:text-foreground"
            >
              GitHub ↗
            </ExternalLink>
          )}
        </div>
      </div>
    </div>
  );
}
