import { Octokit } from "@octokit/rest";

interface GithubContribution {
  contributionsCollection: { totalCommitContributions: number };
}

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const GITHUB_USERNAME = "ruchernchong";

const GITHUB_GRAPHQL_API = "https://api.github.com/graphql";

export const getGitHubFollowers = async (): Promise<number> => {
  try {
    const { data } = await octokit.rest.users.getByUsername({
      username: GITHUB_USERNAME,
    });
    return data.followers;
  } catch (error) {
    console.error("Error fetching GitHub followers:", error);
    return 0;
  }
};

export const getGitHubStars = async (): Promise<number> => {
  try {
    const { data } = await octokit.rest.repos.listForUser({
      username: GITHUB_USERNAME,
      per_page: 100,
    });

    return data.reduce((acc, repo) => acc + (repo.stargazers_count ?? 0), 0);
  } catch (error) {
    console.error("Error fetching GitHub stars:", error);
    return 0;
  }
};

export const getGitHubContributions =
  async (): Promise<GithubContribution | null> => {
    try {
      const query = `
      query {
        user(login: "${GITHUB_USERNAME}") {
          contributionsCollection {
            totalCommitContributions
            restrictedContributionsCount
          }
          repositoriesContributedTo(
            first: 1
            contributionTypes: [COMMIT, ISSUE, PULL_REQUEST, REPOSITORY]
          ) {
            totalCount
          }
          pullRequests(first: 1) {
            totalCount
          }
        }
      }
    `;

      const response = await fetch(GITHUB_GRAPHQL_API, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      const { data } = await response.json();
      return data.user;
    } catch (error) {
      console.error("Error fetching GitHub contributions:", error);
      return null;
    }
  };
