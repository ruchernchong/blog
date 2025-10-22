import type { Metadata } from "next";
import type { WebPage, WithContext } from "schema-dts";
import { StructuredData } from "@/app/(blog)/_components/structured-data";
import globalMetadata from "@/app/(blog)/metadata";
import ProjectCard from "@/app/(blog)/projects/_components/project-card";
import { openGraphImage, twitterImage } from "@/app/(blog)/shared-metadata";
import { PageTitle } from "@/components/shared/page-title";
import { BASE_URL } from "@/config";
import projects from "@/data/projects";

const title = "Projects";
const description =
  "This space serves as both a showcase of my completed projects and playground for experimenting new technologies.";
const canonical = "/projects";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    ...globalMetadata.openGraph,
    title,
    description,
    url: canonical,
    ...openGraphImage,
  },
  twitter: {
    ...globalMetadata.twitter,
    title,
    description,
    ...twitterImage,
  },
  alternates: {
    canonical,
  },
};

const ProjectsPage = async () => {
  const structuredData: WithContext<WebPage> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: `${BASE_URL}/${canonical}`,
  };

  return (
    <>
      <StructuredData data={structuredData} />
      <div>
        <PageTitle title={title} description={description} className="mb-8" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard key={project.name} project={project} />
          ))}
        </div>
      </div>
    </>
  );
};

export default ProjectsPage;
