import { compareDesc } from "date-fns";

type config = {
  sortingKey?: string;
};

export const sortByLatest = (a, b, config?: config) => {
  const sortingKey = config?.sortingKey || "publishedAt";

  return compareDesc(new Date(a[sortingKey]), new Date(b[sortingKey]));
};
