import globalMetadata from "@/app/metadata";
import { openGraphImage, twitterImage } from "@/app/shared-metadata";
import { Chip } from "@/components/Chip";
import { LinkWithIcon } from "@/components/LinkWithIcon";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/card";
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
      <div
        data-umami-event="page-view"
        data-umami-event-page="projects"
        data-umami-event-project-count={projects.length}
      >
        <Typography
          variant="h1"
          className="mb-8"
          data-umami-event="projects-title-view"
        >
          Projects
        </Typography>
        <Typography
          variant="h2"
          className="mb-8"
          data-umami-event="projects-description-view"
        >
          {description}
        </Typography>
        <div className="flex flex-col gap-y-12">
          {projects.map(({ name, description, skills, links }) => (
            <Card
              key={name}
              data-umami-event="project-card-view"
              data-umami-event-project={name}
            >
              <CardHeader>
                <CardTitle
                  data-umami-event="project-title-view"
                  data-umami-event-title={name}
                >
                  {name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="flex flex-wrap gap-2 mb-4"
                  data-umami-event="project-skills-view"
                  data-umami-event-project={name}
                  data-umami-event-skills={skills?.join(",")}
                >
                  {skills?.map((skill) => (
                    <Chip
                      key={skill}
                      data-umami-event="project-skill-click"
                      data-umami-event-skill={skill}
                      data-umami-event-project={name}
                    >
                      {skill}
                    </Chip>
                  ))}
                </div>
                <div
                  className="text-zinc-300"
                  data-umami-event="project-description-view"
                  data-umami-event-project={name}
                >
                  {description}
                </div>
              </CardContent>
              <CardFooter>
                {links.map((link) => (
                  <LinkWithIcon
                    key={link}
                    url={link}
                    data-umami-event="project-link-click"
                    data-umami-event-project={name}
                    data-umami-event-url={link}
                  />
                ))}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
};

export default ProjectsPage;
