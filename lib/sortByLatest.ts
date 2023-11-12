import { compareDesc } from "date-fns";

type Config = {
  sortingKey?: string;
};

type Item = {
  [key: string]: any;
};

export const sortByLatest = (a: Item, b: Item, config?: Config) => {
  const sortingKey = config?.sortingKey || "publishedAt";

  return compareDesc(new Date(a[sortingKey]), new Date(b[sortingKey]));
};
