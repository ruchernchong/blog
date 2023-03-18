import { GetStaticProps } from "next";
import Card from "@/components/Card";
import Layout from "@/components/Layout";
import LinkWithIcon from "@/components/LinkWithIcon";
import StructuredData from "@/components/StructuredData";
import { StarIcon } from "@heroicons/react/24/outline";
import { getGitHubPinnedRepositories, PinnedRepository } from "@/lib/github";
import { WebPage, WithContext } from "schema-dts";
import projects from "@/data/projects";

const Projects = ({
  pinnedRepositories,
}: {
  pinnedRepositories: PinnedRepository[];
}) => {
  const pageDescription: string =
    "Project showcase of past works and experimenting with different technologies";
  const structuredData: WithContext<WebPage> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Projects - Ru Chern",
    description: pageDescription,
  };

  return (
    <Layout title="Projects - Ru Chern" description={pageDescription}>
      <StructuredData data={structuredData} />
      <div className="mb-8 flex flex-col">
        <h1 className="mb-4 text-3xl font-bold md:text-4xl">Projects</h1>
        <div className="mb-8">
          {projects.map(({ name, description, link }) => {
            const linkText = link.replace("https://", "");

            return (
              <div key={name} className="flex flex-col items-start">
                <h3 className="mb-2 text-lg font-semibold md:text-2xl">
                  {name}
                </h3>
                <div className="mb-4 text-neutral-600 dark:text-neutral-400">
                  {description}
                </div>
                <LinkWithIcon url={link} />
              </div>
            );
          })}
        </div>
        <h2 className="mb-0 text-xl font-semibold md:text-2xl">GitHub</h2>
        <p className="mb-8 text-sm italic text-neutral-600 dark:text-neutral-400">
          (Powered by GitHub GraphQL API)
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {pinnedRepositories.map(
            ({ id, name, description, stargazers, url }) => {
              return (
                <Card key={id}>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <div className="text-xl">{name}</div>
                    <div className="flex-1 text-neutral-600 dark:text-neutral-400">
                      {description}
                    </div>
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
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  const pinnedRepositories = await getGitHubPinnedRepositories();

  return {
    props: {
      pinnedRepositories,
    },
  };
};

export default Projects;
