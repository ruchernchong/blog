import { CodeIcon, LinkSquare01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { SiGithub } from "@icons-pack/react-simple-icons";
import Image from "next/image";
import Link from "next/link";
import { PageTitle } from "@/components/shared/page-title";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import projects from "@/data/projects";
import { cn } from "@/lib/utils";
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

function ProjectCard({
  project,
  featured = false,
}: {
  project: Project;
  featured?: boolean;
}) {
  const displayedSkills = project.skills.slice(0, 4);
  const remainingCount = project.skills.length - 4;

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all duration-200 hover:-translate-y-0.5",
        featured
          ? "ring-1 ring-primary/20 hover:shadow-[0_8px_30px_-10px_oklch(0.60_0.18_25/0.25)]"
          : "hover:shadow-[0_8px_30px_-10px_oklch(0_0_0/0.08)]",
      )}
    >
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
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground text-lg">
                {project.name}
              </h3>
              {featured && <Badge variant="default">Featured</Badge>}
            </div>
            {project.description && (
              <p className="line-clamp-2 text-muted-foreground text-sm">
                {project.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {displayedSkills.map((skill) => (
              <Badge
                key={skill}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {skill}
              </Badge>
            ))}
            {remainingCount > 0 && (
              <Badge className="bg-primary text-primary-foreground hover:bg-primary/90">
                +{remainingCount}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
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
                    <HugeiconsIcon
                      icon={LinkSquare01Icon}
                      size={16}
                      strokeWidth={2}
                    />
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
    <div className="flex flex-col gap-8">
      <PageTitle
        title="Projects"
        description="A showcase of completed projects and experiments with new technologies."
        icon={
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <HugeiconsIcon icon={CodeIcon} size={20} className="text-primary" />
          </div>
        }
      />

      {/* Featured Section */}
      {featuredProjects.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-6 font-semibold text-lg text-muted-foreground">
            Featured
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {featuredProjects.map((project) => (
              <ProjectCard key={project.slug} project={project} featured />
            ))}
          </div>
        </section>
      )}

      {/* Other Projects */}
      {otherProjects.length > 0 && (
        <section>
          <h2 className="mb-6 font-semibold text-lg text-muted-foreground">
            More Projects
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {otherProjects.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
