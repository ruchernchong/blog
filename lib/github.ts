import {
  ApolloClient,
  createHttpLink,
  gql,
  InMemoryCache,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

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

const link = createHttpLink({
  uri: "https://api.github.com/graphql",
});

const authLink = setContext((_, { headers }) => {
  return {
    headers: {
      ...headers,
      authorization: `Bearer ${process.env.GITHUB_ACCESS_TOKEN}`,
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(link),
  cache: new InMemoryCache(),
});

export const getGitHubPinnedRepositories = async (): Promise<
  PinnedRepository[]
> => {
  const { data } = await client.query({
    query: gql`
      {
        user(login: "ruchernchong") {
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

  const { user } = data;
  return user.pinnedItems.edges.map((edge) => edge.node);
};

export const getGitHubContributions = async () => {
  const { data } = await client.query({
    query: gql`
      {
        user(login: "ruchernchong") {
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

  const { user } = data;
  return user;
};
