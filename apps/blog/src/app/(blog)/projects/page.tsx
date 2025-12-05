"use client";

import { ExternalLink, Github, Sparkles } from "lucide-react";
import { Geist } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import projects from "@/data/projects";
import { cn } from "@/lib/utils";
import type { Project } from "@/types";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

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

const ProjectCard = ({
  project,
  index,
}: {
  project: Project;
  index: number;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const projectNumber = String(index + 1).padStart(2, "0");
  const featured = project.featured;
  const hasImage = project.coverImage || project.previewImage;

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-3xl bg-zinc-950 transition-all duration-700 ease-out",
        "border border-white/5 shadow-black/40 shadow-lg",
        "hover:-translate-y-1 hover:border-pink-500/20 hover:shadow-2xl hover:shadow-pink-500/10",
        featured ? "col-span-1 md:col-span-2" : "col-span-1",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
            )}
            style={{
              clipPath: featured
                ? isHovered
                  ? "polygon(0 0, 100% 0, 85% 100%, 0 100%)"
                  : "polygon(0 0, 95% 0, 80% 100%, 0 100%)"
                : "polygon(0 0, 100% 0, 100% 85%, 0 100%)",
            }}
          >
            <Image
              src={project.coverImage || project.previewImage || ""}
              alt={project.name}
              fill
              className={cn(
                "object-cover transition-all duration-700",
                isHovered
                  ? "scale-110 brightness-110 contrast-105"
                  : "brightness-90",
              )}
            />
            {/* Colour overlay */}
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-br from-pink-500/20 to-pink-900/30 mix-blend-overlay transition-opacity duration-500",
                isHovered ? "opacity-60" : "opacity-30",
              )}
            />
          </div>
        )}

        {/* Content Section */}
        <div
          className={cn(
            "relative flex flex-col gap-4 p-8",
            featured && hasImage && "md:w-1/2 md:pl-4",
          )}
        >
          {/* Number accent */}
          <span
            className={cn(
              "-top-2 absolute right-6 font-black text-7xl transition-all duration-500",
              isHovered ? "text-pink-500/30" : "text-pink-500/10",
            )}
            style={{
              WebkitTextStroke: "1px currentColor",
              WebkitTextFillColor: "transparent",
            }}
          >
            {projectNumber}
          </span>

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
            {project.skills.slice(0, featured ? 6 : 4).map((skill) => (
              <span
                key={skill}
                className="rounded border border-pink-500/20 bg-pink-500/10 px-2.5 py-1 font-medium text-pink-500 text-xs"
              >
                {skill}
              </span>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            {project.links.map((link) => (
              <Link
                key={link}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2.5 font-semibold text-sm text-white/70 transition-all duration-300 hover:bg-pink-500/15 hover:text-pink-500"
              >
                {isGitHubLink(link) ? (
                  <Github className="h-4 w-4" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                {isGitHubLink(link) ? "Source" : "Live"}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
};

const ProjectsPage = () => {
  const sorted = [
    ...projects.filter((p) => p.featured),
    ...projects.filter((p) => !p.featured),
  ];

  return (
    <div className={cn(geist.variable, "font-[family-name:var(--font-geist)]")}>
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
          {sorted.map((project, index) => (
            <ProjectCard key={project.slug} project={project} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectsPage;
