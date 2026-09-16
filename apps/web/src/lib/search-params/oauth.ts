import {
  createSearchParamsCache,
  parseAsString,
  type UrlKeys,
} from "nuqs/server";

export const oauthSearchParams = {
  clientId: parseAsString,
  scope: parseAsString,
  error: parseAsString,
  errorDescription: parseAsString,
};

export const oauthSearchParamKeys = {
  clientId: "client_id",
  errorDescription: "error_description",
} satisfies UrlKeys<typeof oauthSearchParams>;

export const oauthSearchParamsCache = createSearchParamsCache(
  oauthSearchParams,
  { urlKeys: oauthSearchParamKeys },
);
