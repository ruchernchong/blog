import { createLoader, parseAsString } from "nuqs/server";

export const tagSearchParams = {
  tag: parseAsString,
};

export const loadSearchParams = createLoader(tagSearchParams);
