import { cn } from "@heroui/react";
import { cardVariants } from "@heroui/styles";
import type { Metadata, Route } from "next";
import globalMetadata from "@/app/metadata";
import { AnnotationRail } from "@/components/annotation-rail";
import ExternalLink from "@/components/external-link";
import { Eyebrow } from "@/components/eyebrow";
import { PageHeader } from "@/components/page-header";
import projects from "@/data/projects";
import { liveUrl, repoUrl } from "@/lib/links";
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

function ProjectLinks({ project }: { project: Project }) {
  const live = liveUrl(project.links);
  const repo = repoUrl(project.links);
  return (
    <div className="flex shrink-0 items-center gap-3 font-mono text-xs">
      {live && (
        <ExternalLink
          href={live as Route}
          className="text-accent hover:underline"
        >
          live ↗
        </ExternalLink>
      )}
      {repo && (
        <ExternalLink
          href={repo as Route}
          className="text-muted hover:text-foreground"
        >
          source ↗
        </ExternalLink>
      )}
    </div>
  );
}

export default function ProjectsPage() {
  const featured = projects.filter((project) => project.featured);
  const archive = projects.filter((project) => !project.featured);

  return (
    <div className="flex flex-col gap-16">
      <PageHeader
        eyebrow="Build log"
        title="Projects"
        description={description}
      />

      {featured.length > 0 && (
        <section className="flex flex-col gap-6">
          <Eyebrow>Featured</Eyebrow>
          <ul className="flex flex-col gap-4">
            {featured.map((project) => (
              <li
                key={project.slug}
                className={cn(
                  cardVariants({ variant: "transparent" }).base(),
                  "flex flex-col gap-3",
                )}
              >
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="font-display font-medium text-2xl text-foreground">
                    {project.name}
                  </h2>
                  <ProjectLinks project={project} />
                </div>
                {project.description && (
                  <p className="text-muted leading-relaxed">
                    {project.description}
                  </p>
                )}
                <AnnotationRail>
                  {project.skills.map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </AnnotationRail>
              </li>
            ))}
          </ul>
        </section>
      )}

      {archive.length > 0 && (
        <section className="flex flex-col gap-6">
          <Eyebrow>Archive</Eyebrow>
          <ul className="flex flex-col">
            {archive.map((project) => (
              <li
                key={project.slug}
                className="flex flex-col gap-2 border-border border-b py-5 last:border-0"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="font-display font-medium text-foreground text-lg">
                    {project.name}
                  </h2>
                  <ProjectLinks project={project} />
                </div>
                {project.description && (
                  <p className="text-muted text-sm leading-relaxed">
                    {project.description}
                  </p>
                )}
                <AnnotationRail>
                  {project.skills.slice(0, 6).map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </AnnotationRail>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
