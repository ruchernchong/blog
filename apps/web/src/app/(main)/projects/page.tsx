import type { Metadata } from "next";
import { ProjectCard } from "@/app/(main)/projects/components/project-card";
import { ProjectStats } from "@/app/(main)/projects/components/project-stats";
import { PageHeader } from "@/app/components/page-header";
import { SurfaceCard } from "@/app/components/surface-card";
import globalMetadata from "@/app/metadata";
import projects from "@/data/projects";

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

export default function ProjectsPage() {
  const featuredProjects = projects.filter((project) => project.featured);
  const otherProjects = projects.filter((project) => !project.featured);

  return (
    <SurfaceCard className="flex flex-col gap-11">
      <PageHeader
        title="Projects"
        description="Things I've built, from analytics platforms to satirical APIs."
      />

      <ProjectStats />

      <div className="flex flex-col gap-5">
        {featuredProjects.map((project) => (
          <ProjectCard key={project.slug} project={project} featured />
        ))}

        {otherProjects.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2">
            {otherProjects.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        )}
      </div>
    </SurfaceCard>
  );
}
