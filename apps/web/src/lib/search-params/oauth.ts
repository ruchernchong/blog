import {
  createSearchParamsCache,
  parseAsString,
  type UrlKeys,
} from "nuqs/server";

export const oauthSearchParams = {
  clientId: parseAsString,
  scope: parseAsString,
};

export const oauthSearchParamKeys = {
  clientId: "client_id",
} satisfies UrlKeys<typeof oauthSearchParams>;

export const oauthSearchParamsCache = createSearchParamsCache(
  oauthSearchParams,
  { urlKeys: oauthSearchParamKeys },
);
