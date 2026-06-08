import { cn } from "@heroui/react";
import type { Route } from "next";
import Link from "next/link";
import type { Project } from "@/types";

const WINDOW_GRADIENTS = [
  "from-indigo-100 via-purple-50 to-pink-100",
  "from-emerald-100 via-teal-50 to-cyan-100",
  "from-amber-100 via-orange-50 to-red-100",
  "from-sky-100 via-blue-50 to-indigo-100",
];

function isGitHubUrl(url: string): boolean {
  try {
    return new URL(url).hostname === "github.com";
  } catch {
    return false;
  }
}

function BrowserWindow({
  url,
  gradientIndex,
  label,
}: {
  url?: string;
  gradientIndex: number;
  label: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border shadow-sm">
      <div className="flex items-center gap-1.5 border-border border-b bg-default px-4 py-2.5">
        <div className="size-2.5 rounded-full bg-red-400" />
        <div className="size-2.5 rounded-full bg-yellow-400" />
        <div className="size-2.5 rounded-full bg-green-400" />
        {url && (
          <div className="ml-2 flex-1 truncate rounded-md bg-background px-3 py-0.5 font-mono text-muted text-xs">
            {url}
          </div>
        )}
      </div>
      <div
        className={cn(
          "flex h-44 items-center justify-center bg-gradient-to-br",
          WINDOW_GRADIENTS[gradientIndex % WINDOW_GRADIENTS.length],
        )}
      >
        <span className="font-semibold text-foreground/40 text-xl">
          {label}
        </span>
      </div>
    </div>
  );
}

interface MinimalFeaturedWorkProps {
  projects: Project[];
}

export function MinimalFeaturedWork({ projects }: MinimalFeaturedWorkProps) {
  const featuredProjects = projects.filter((p) => p.featured).slice(0, 4);

  if (featuredProjects.length === 0) return null;

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-baseline justify-between">
        <h2 className="font-bold text-2xl text-foreground tracking-tight">
          Selected Work.
        </h2>
        <Link
          href="/minimal/projects"
          className="text-muted text-sm transition-colors hover:text-foreground"
        >
          View all →
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {featuredProjects.map((project, index) => {
          const liveUrl = project.links.find(
            (l) => !isGitHubUrl(l as string),
          ) as string | undefined;
          const githubUrl = project.links.find((l) =>
            isGitHubUrl(l as string),
          ) as string | undefined;
          const displayUrl = liveUrl
            ? new URL(liveUrl).hostname
            : githubUrl
              ? "github.com"
              : undefined;

          return (
            <div key={project.slug} className="flex flex-col gap-4">
              <BrowserWindow
                url={displayUrl}
                gradientIndex={index}
                label={project.name}
              />
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold text-foreground">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="line-clamp-2 text-muted text-sm leading-relaxed">
                    {project.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {project.skills.slice(0, 4).map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-border px-2.5 py-0.5 text-muted text-xs"
                    >
                      {skill}
                    </span>
                  ))}
                  {project.skills.length > 4 && (
                    <span className="rounded-full border border-border px-2.5 py-0.5 text-muted text-xs">
                      +{project.skills.length - 4}
                    </span>
                  )}
                </div>
                <div className="flex gap-2 pt-1">
                  {liveUrl && (
                    <a
                      href={liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-foreground px-4 py-1.5 font-medium text-background text-xs transition-opacity hover:opacity-85"
                    >
                      Live
                    </a>
                  )}
                  {githubUrl && (
                    <a
                      href={githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-border px-4 py-1.5 text-muted text-xs transition-colors hover:text-foreground"
                    >
                      GitHub
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
