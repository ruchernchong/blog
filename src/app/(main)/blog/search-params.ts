import { createSearchParamsCache, parseAsString } from "nuqs/server";

export const blogSearchParamsCache = createSearchParamsCache({
  tag: parseAsString,
  series: parseAsString,
});
