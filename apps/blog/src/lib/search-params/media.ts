import {
  createLoader,
  parseAsInteger,
  parseAsString,
} from "nuqs/server";

export const mediaSearchParams = {
  search: parseAsString,
  limit: parseAsInteger.withDefault(50),
  offset: parseAsInteger.withDefault(0),
};

export const loadMediaSearchParams = createLoader(mediaSearchParams);
