import type { Metadata } from "next";
import globalMetadata from "@/app/metadata";
import { openGraphImage, twitterImage } from "@/app/shared-metadata";
import { Chip } from "@/components/Chip";
import { ItemOverlay } from "@/components/ItemOverlay";
import { LinkWithIcon } from "@/components/LinkWithIcon";
import { StructuredData } from "@/components/StructuredData";
import { Typography } from "@/components/Typography";
import projects from "@/data/projects";
import type { WebPage, WithContext } from "schema-dts";
import { BASE_URL } from "@/config";

const title = "Projects";
const description =
  "A showcase of my past projects and/or experimenting with different technologies";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    ...globalMetadata.openGraph,
    title,
    description,
    url: "/projects",
    ...openGraphImage,
  },
  twitter: {
    ...globalMetadata.twitter,
    title,
    description,
    ...twitterImage,
  },
  alternates: {
    canonical: "/projects",
  },
};

const ProjectsPage = async () => {
  const structuredData: WithContext<WebPage> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": "/projects",
    },
    description,
    url: `${BASE_URL}/projects`,
  };

  return (
    <>
      <StructuredData data={structuredData} />
      <Typography variant="h1" className="mb-8">
        Projects
      </Typography>
      <Typography variant="h2" className="mb-8">
        {description}
      </Typography>
      <div className="flex flex-col gap-y-12">
        {projects.map(({ name, description, skills, links }) => {
          return (
            <div key={name} className="group relative">
              <div className="flex flex-col items-start gap-4">
                <ItemOverlay />
                <Typography variant="h3" className="z-20">
                  {name}
                </Typography>
                <div className="flex flex-wrap gap-2">
                  {skills?.map((skill) => {
                    return <Chip key={skill}>{skill}</Chip>;
                  })}
                </div>
                <div className="z-20 text-gray-400">{description}</div>
                {links.map((link) => (
                  <LinkWithIcon key={link} url={link} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default ProjectsPage;
