import {
  ApolloClient,
  createHttpLink,
  gql,
  InMemoryCache,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { Octokit } from "@octokit/rest";
import { cacheLife, cacheTag } from "next/cache";

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
  "use cache";
  cacheLife("hours");
  cacheTag("github:pinned");

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
  "use cache";
  cacheLife("hours");
  cacheTag("github:contributions");

  const { data } = await gqlClient.query({
    query: gql`
      {
        user(login: "${GITHUB_USERNAME}") {
          contributionsCollection {
            totalCommitContributions
          }
          pullRequests(first: 1) {
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

export const getGitHubTotalCommits = async (): Promise<number> => {
  "use cache";
  cacheLife("days");
  cacheTag("github:commits:total");

  const START_YEAR = 2014; // account created 2014-12-29
  const currentYear = new Date().getUTCFullYear();
  const years = Array.from(
    { length: currentYear - START_YEAR + 1 },
    (_, i) => START_YEAR + i,
  );

  // GitHub caps contributionsCollection at a 1-year span, and its per-query
  // resource budget is content-dependent — heavy years (plus Apollo's injected
  // __typename fields) trip RESOURCE_LIMITS_EXCEEDED when batched. Query one
  // year per request in parallel instead. `no-cache` avoids Apollo normalising
  // the id-less User across requests (which errors on merge); Next's "use cache"
  // is the real cache. A failed year contributes 0 rather than zeroing the sum.
  const counts = await Promise.all(
    years.map((year) =>
      gqlClient
        .query<{
          user: {
            contributionsCollection: { totalCommitContributions: number };
          };
        }>({
          fetchPolicy: "no-cache",
          query: gql`
            {
              user(login: "${GITHUB_USERNAME}") {
                contributionsCollection(from: "${year}-01-01T00:00:00Z", to: "${year}-12-31T23:59:59Z") {
                  totalCommitContributions
                }
              }
            }
          `,
        })
        .then(
          ({ data }) =>
            data.user?.contributionsCollection?.totalCommitContributions ?? 0,
        )
        .catch(() => 0),
    ),
  );

  return counts.reduce((sum, count) => sum + count, 0);
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
  "use cache";
  cacheLife("hours");
  cacheTag("github:stars");

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
