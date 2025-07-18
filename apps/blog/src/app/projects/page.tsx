import globalMetadata from "@/app/metadata";
import { openGraphImage, twitterImage } from "@/app/shared-metadata";
import ProjectCard from "@/components/project-card";
import { StructuredData } from "@/components/StructuredData";
import { Typography } from "@/components/Typography";
import { BASE_URL } from "@/config";
import projects from "@/data/projects";
import type { Metadata } from "next";
import type { WebPage, WithContext } from "schema-dts";

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
        <Typography variant="h1" className="mb-8">
          Projects
        </Typography>
        <Typography variant="h2" className="mb-8">
          {description}
        </Typography>
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
