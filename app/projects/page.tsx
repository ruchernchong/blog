import { Metadata } from "next";
import globalMetadata from "@/app/metadata";
import Card from "@/components/Card";
import { LinkWithIcon } from "@/components/LinkWithIcon";
import { Chip } from "@/components/Chip";
import { StructuredData } from "@/components/StructuredData";
import { H1, H2, H3 } from "@/components/Typography";
import { BASE_URL } from "@/config";
import { StarIcon } from "@heroicons/react/24/outline";
import { getGitHubPinnedRepositories } from "@/lib/github";
import { WebPage, WithContext } from "schema-dts";
import projects from "@/data/projects.json";

const title: string = `Projects`;
const pageDescription: string =
  "A showcase of my past projects and/or experimenting with different technologies";

export const metadata: Metadata = {
  ...globalMetadata,
  title,
  description: pageDescription,
  openGraph: {
    ...globalMetadata.openGraph,
    title: "Projects",
    description: pageDescription,
    url: `${BASE_URL}/projects`,
  },
  twitter: {
    ...globalMetadata.twitter,
    title: "Projects",
    description: pageDescription,
  },
};

const ProjectsPage = async () => {
  const pinnedRepositories = await getGitHubPinnedRepositories();

  const structuredData: WithContext<WebPage> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Projects | Ru Chern",
    description: pageDescription,
  };

  return (
    <>
      <StructuredData data={structuredData} />
      <H1 className="mb-8">Projects</H1>
      <H2 className="mb-8">{pageDescription}</H2>
      <div className="flex flex-col gap-8">
        {projects.map(({ name, description, skills, link }) => {
          return (
            <div key={name} className="flex flex-col items-start gap-4">
              <H3>{name}</H3>
              <div className="flex flex-wrap gap-2">
                {skills?.map((skill) => {
                  return <Chip key={skill}>{skill}</Chip>;
                })}
              </div>
              <div className="text-gray-400">{description}</div>
              <LinkWithIcon url={link} />
            </div>
          );
        })}
      </div>
      {/*<div className="flex gap-4">*/}
      {/*  <div>*/}
      {/*    <div className="text-4xl font-bold">GitHub</div>*/}
      {/*    <p className="text-sm italic text-gray-400">*/}
      {/*      (Powered by GitHub GraphQL API)*/}
      {/*    </p>*/}
      {/*  </div>*/}
      {/*  <div className="grid gap-4 md:grid-cols-2">*/}
      {/*    {pinnedRepositories.map(*/}
      {/*      ({ id, name, description, stargazers, url }) => {*/}
      {/*        return (*/}
      {/*          <Card key={id}>*/}
      {/*            <a href={url} target="_blank" rel="noopener noreferrer">*/}
      {/*              <div className="text-xl">{name}</div>*/}
      {/*              <div className="flex-1 text-gray-400">*/}
      {/*                {description}*/}
      {/*              </div>*/}
      {/*              <div className="flex flex-row items-center">*/}
      {/*                <StarIcon className="mr-2 h-4 w-4" />*/}
      {/*                <div>{stargazers.totalCount}</div>*/}
      {/*              </div>*/}
      {/*            </a>*/}
      {/*          </Card>*/}
      {/*        );*/}
      {/*      }*/}
      {/*    )}*/}
      {/*  </div>*/}
      {/*</div>*/}
    </>
  );
};

export default ProjectsPage;
