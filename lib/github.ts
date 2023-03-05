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
  url: string;
  stargazers: {
    totalCount: number;
  };
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
  Partial<PinnedRepository>[]
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
