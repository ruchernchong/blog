import { Metadata } from "next";
import globalMetadata from "@/app/metadata";
import Card from "@/components/Card";
import LinkWithIcon from "@/components/LinkWithIcon";
import Chip from "@/components/Chip";
import StructuredData from "@/components/StructuredData";
import { H1, H3 } from "@/components/Typography";
import { HOST_URL } from "@/config";
import { StarIcon } from "@heroicons/react/24/outline";
import { getGitHubPinnedRepositories } from "@/lib/github";
import { WebPage, WithContext } from "schema-dts";
import projects from "@/data/projects";

const pageDescription: string =
  "Project showcase of past works and experimenting with different technologies";

export const metadata: Metadata = {
  ...globalMetadata,
  title: "Projects",
  description: pageDescription,
  openGraph: {
    ...globalMetadata.openGraph,
    title: "Projects | Ru Chern",
    description: pageDescription,
    url: `${HOST_URL}/projects`,
  },
  twitter: {
    ...globalMetadata.twitter,
    title: "Projects | Ru Chern",
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
      <div className="flex flex-col">
        <H1>Projects</H1>
        <p className="mb-4 text-neutral-400">{pageDescription}</p>
        <div className="mb-8">
          {projects.map(({ name, description, skills, link }) => {
            return (
              <div key={name} className="mb-8 flex flex-col items-start">
                <H3>{name}</H3>
                <div className="mb-4 text-neutral-400">{description}</div>
                <div className="mb-4 flex flex-wrap gap-2">
                  {skills?.map((skill) => {
                    skill = skill.toLowerCase();

                    return (
                      <Chip key={skill} size="small">
                        {skill}
                      </Chip>
                    );
                  })}
                </div>
                <LinkWithIcon url={link} />
              </div>
            );
          })}
        </div>
        <h2 className="mb-0 text-xl font-semibold md:text-2xl">GitHub</h2>
        <p className="mb-8 text-sm italic text-neutral-400">
          (Powered by GitHub GraphQL API)
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {pinnedRepositories.map(
            ({ id, name, description, stargazers, url }) => {
              return (
                <Card key={id}>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <div className="text-xl">{name}</div>
                    <div className="flex-1 text-neutral-400">{description}</div>
                    <div className="flex flex-row items-center">
                      <StarIcon className="mr-2 h-4 w-4" />
                      <div>{stargazers.totalCount}</div>
                    </div>
                  </a>
                </Card>
              );
            }
          )}
        </div>
      </div>
    </>
  );
};

export default ProjectsPage;
