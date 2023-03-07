import { GetStaticProps } from "next";
import Layout from "@/components/Layout";
import { StarIcon } from "@heroicons/react/24/outline";
import { getGitHubPinnedRepositories, PinnedRepository } from "@/lib/github";

const Projects = ({
  pinnedRepositories,
}: {
  pinnedRepositories: PinnedRepository[];
}) => {
  return (
    <Layout title="Projects - Ru Chern">
      <div className="mb-8 flex flex-col">
        <h1 className="mb-4 text-3xl font-bold md:text-4xl">Projects</h1>
        <h2 className="mb-0 text-xl font-semibold md:text-2xl">GitHub</h2>
        <p className="mb-8 text-sm italic text-neutral-600 dark:text-neutral-400">
          (Powered by GitHub GraphQL API)
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {pinnedRepositories.map(
            ({ id, name, description, stargazers, url }) => {
              return (
                <a
                  key={id}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col rounded-2xl border p-4 no-underline md:border-neutral-600 hover:md:border-neutral-400"
                >
                  <div className="text-xl">{name}</div>
                  <div className="flex-1 text-neutral-600 dark:text-neutral-400">
                    {description}
                  </div>
                  <div className="flex flex-row items-center">
                    <StarIcon className="mr-2 h-4 w-4" />
                    <div>{stargazers.totalCount}</div>
                  </div>
                </a>
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
