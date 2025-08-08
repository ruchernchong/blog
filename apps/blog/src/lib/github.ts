import { Octokit } from "@octokit/rest";
import {
  ApolloClient,
  createHttpLink,
  gql,
  InMemoryCache,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

const GITHUB_USERNAME = "ruchernchong";

// Standardize on GH_ACCESS_TOKEN
const octokit = new Octokit({
  auth: process.env.GH_ACCESS_TOKEN,
});

// GraphQL client setup
const link = createHttpLink({ uri: "https://api.github.com/graphql" });
const authLink = setContext((_, { headers }) => ({
  headers: {
    ...headers,
    authorization: `Bearer ${process.env.GH_ACCESS_TOKEN}`,
  },
}));
const gqlClient = new ApolloClient({
  link: authLink.concat(link),
  cache: new InMemoryCache(),
});

export type PinnedRepository = {
  id: string;
  name: string;
  description: string;
  url: string;
  stargazers: {
    totalCount: number;
  };
};

export type GitHubProfile = {
  contributionsCollection: {
    totalCommitContributions: number;
  };
  pullRequests: {
    totalCount: number;
  };
  followers: {
    totalCount: number;
  };
  url: string;
};

type GetPinnedRepositoriesResult = {
  user: {
    pinnedItems: {
      edges: {
        node: PinnedRepository;
      }[];
    };
  };
};

export const getGitHubPinnedRepositories = async (): Promise<
  PinnedRepository[]
> => {
  const { data } = await gqlClient.query<GetPinnedRepositoriesResult>({
    query: gql`
      {
        user(login: "${GITHUB_USERNAME}") {
          pinnedItems(first: 6, types: [REPOSITORY]) {
            totalCount
            edges {
              node {
                ... on Repository {
                  id
                  name
                  description
                  url
                  stargazers {
                    totalCount
                  }
                }
              }
            }
          }
        }
      }
    `,
  });

  return data.user.pinnedItems.edges.map(({ node }) => node);
};

export const getGitHubContributions = async (): Promise<GitHubProfile> => {
  const { data } = await gqlClient.query({
    query: gql`
      {
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
          openIssues: issues(states: OPEN) {
            totalCount
          }
          closedIssues: issues(states: CLOSED) {
            totalCount
          }
          followers {
            totalCount
          }
          url
        }
      }
    `,
  });

  return data.user as GitHubProfile;
};

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
