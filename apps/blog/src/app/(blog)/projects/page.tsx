import { Card, CardBody, CardFooter } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { SiGithub } from "@icons-pack/react-simple-icons";
import { ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import projects from "@/data/projects";
import type { Project } from "@/types";

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

function ProjectCard({ project }: { project: Project }) {
  const displayedSkills = project.skills.slice(0, 4);
  const remainingCount = project.skills.length - 4;

  return (
    <Card>
      <div className="relative h-56 w-full overflow-hidden">
        <Image
          fill
          src={
            project.coverImage ??
            "https://images.unsplash.com/photo-1505238680356-667803448bb6?w=800&h=450&fit=crop"
          }
          alt={project.name}
          className="object-cover"
        />
      </div>
      <CardBody>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg text-zinc-100">
                {project.name}
              </h3>
            </div>
            {project.description && (
              <p className="line-clamp-2 text-sm text-zinc-400">
                {project.description}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            {displayedSkills.map((skill) => (
              <Chip
                key={skill}
                size="sm"
                classNames={{ base: "bg-pink-500 text-white" }}
              >
                {skill}
              </Chip>
            ))}
            {remainingCount > 0 && (
              <Chip size="sm" classNames={{ base: "bg-pink-500 text-white" }}>
                +{remainingCount}
              </Chip>
            )}
          </div>
        </div>
      </CardBody>
      <CardFooter>
        <div className="flex gap-2">
          {project.links.map((link) => {
            return (
              <Link
                key={link}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="flex items-center gap-2 text-sm">
                  {isGitHubLink(link) ? (
                    <SiGithub className="size-4" />
                  ) : (
                    <ExternalLink className="size-4" />
                  )}
                  {isGitHubLink(link) ? "Source" : "Live"}
                </div>
              </Link>
            );
          })}
        </div>
      </CardFooter>
    </Card>
  );
}

export default function ProjectsPage() {
  const featuredProjects = projects.filter((project) => project.featured);
  const otherProjects = projects.filter((project) => !project.featured);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-16">
        <h1 className="mb-4 font-bold text-4xl text-zinc-100 tracking-tight">
          Projects
        </h1>
        <p className="max-w-2xl text-lg text-zinc-400 leading-relaxed">
          A showcase of completed projects and experiments with new
          technologies.
        </p>
      </header>

      {/* Featured Section */}
      {featuredProjects.length > 0 && (
        <section className="mb-16">
          <h2 className="mb-8 flex items-center gap-3 font-semibold text-xl text-zinc-300">
            <span className="h-px flex-1 bg-gradient-to-r from-pink-500/50 to-transparent" />
            <span>Featured</span>
            <span className="h-px flex-1 bg-gradient-to-l from-pink-500/50 to-transparent" />
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {featuredProjects.map((project) => {
              return <ProjectCard key={project.slug} project={project} />;
            })}
          </div>
        </section>
      )}

      {/* Other Projects */}
      {otherProjects.length > 0 && (
        <section>
          <h2 className="mb-8 flex items-center gap-3 font-semibold text-xl text-zinc-300">
            <span className="h-px flex-1 bg-gradient-to-r from-zinc-700 to-transparent" />
            <span>More Projects</span>
            <span className="h-px flex-1 bg-gradient-to-l from-zinc-700 to-transparent" />
          </h2>
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
