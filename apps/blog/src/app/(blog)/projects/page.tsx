import { SiGithub } from "@icons-pack/react-simple-icons";
import { ExternalLink, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import projects from "@/data/projects";
import { cn } from "@/lib/utils";
import type { Project } from "@/types";

const isGitHubLink = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === "github.com" ||
      parsed.hostname.endsWith(".github.com")
    );
  } catch {
    return false;
  }
};

const ProjectCard = ({ project }: { project: Project }) => {
  const featured = project.featured;
  const hasImage = project.coverImage ?? project.previewImage;

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-3xl bg-zinc-950 transition-all duration-700 ease-out",
        "border border-white/5 shadow-black/40 shadow-lg",
        featured ? "col-span-1 md:col-span-2" : "col-span-1",
      )}
    >
      <div
        className={cn(
          "relative flex",
          featured ? "flex-col md:flex-row" : "flex-col",
        )}
      >
        {/* Image Section - Diagonal clip */}
        {hasImage && (
          <div
            className={cn(
              "relative overflow-hidden transition-all duration-700",
              featured ? "h-64 md:h-auto md:w-1/2" : "h-48",
              featured
                ? "[clip-path:polygon(0_0,95%_0,80%_100%,0_100%)] group-hover:[clip-path:polygon(0_0,100%_0,85%_100%,0_100%)]"
                : "[clip-path:polygon(0_0,100%_0,100%_85%,0_100%)]",
            )}
          >
            <Image
              fill
              src={project.coverImage || project.previewImage || ""}
              alt={project.name}
              className="brightness-90 transition-all duration-700 group-hover:scale-110 group-hover:brightness-110 group-hover:contrast-105"
            />
            {/* Colour overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-pink-900/30 opacity-30 mix-blend-overlay transition-opacity duration-500 group-hover:opacity-60" />
          </div>
        )}

        {/* Content Section */}
        <div
          className={cn(
            "relative flex flex-col gap-4 p-8",
            featured && hasImage && "md:w-1/2 md:pl-4",
          )}
        >
          {featured && (
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-pink-500/20 bg-pink-500/10 px-3 py-1 font-bold text-pink-500 text-xs uppercase tracking-wider">
              <Sparkles className="h-3 w-3" />
              Featured
            </span>
          )}

          <h3 className="font-bold text-2xl text-white/90 tracking-tight">
            {project.name}
          </h3>

          {project.description && (
            <p className="text-base text-white/50 leading-relaxed">
              {project.description}
            </p>
          )}

          <div className="mt-auto flex flex-wrap gap-2 pt-2">
            {project.skills.slice(0, featured ? 6 : 4).map((skill) => {
              return (
                <span
                  key={skill}
                  className="rounded border border-pink-500/20 bg-pink-500/10 px-2.5 py-1 font-medium text-pink-500 text-xs"
                >
                  {skill}
                </span>
              );
            })}
          </div>

          <div className="flex gap-3 pt-2">
            {project.links.map((link) => {
              return (
                <Link
                  key={link}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2.5 font-semibold text-sm text-white/70 transition-all duration-300 hover:bg-pink-500/15 hover:text-pink-500"
                >
                  {isGitHubLink(link) ? (
                    <SiGithub className="h-4 w-4" />
                  ) : (
                    <ExternalLink className="h-4 w-4" />
                  )}
                  {isGitHubLink(link) ? "Source" : "Live"}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </article>
  );
};

export default function ProjectsPage() {
  const sorted = [
    ...projects.filter((project) => project.featured),
    ...projects.filter((project) => !project.featured),
  ];

  return (
    <>
      {/* Background */}
      <div className="-z-10 fixed inset-0 bg-zinc-950" />

      {/* Glow effect */}
      <div className="-z-10 pointer-events-none fixed inset-0 overflow-hidden">
        <div className="-translate-y-1/3 absolute top-0 right-0 h-[600px] w-[600px] translate-x-1/3 rounded-full bg-pink-500/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-6 py-8">
        <header className="mb-16">
          <div className="mb-4 h-1 w-16 rounded-full bg-gradient-to-r from-pink-500 to-pink-500/40" />
          <h1 className="mb-6 font-black text-5xl text-white/95 tracking-tight md:text-7xl">
            Projects
          </h1>
          <p className="max-w-lg text-white/40 text-xl leading-relaxed">
            A showcase of completed projects and experiments with new
            technologies.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {sorted.map((project) => {
            return <ProjectCard key={project.slug} project={project} />;
          })}
        </div>
      </div>
    </>
  );
}
