import { compareDesc } from "date-fns";

interface Config<T> {
  sortingKey?: keyof T;
}

interface Item {
  [key: string]: any;
}

export const sortByLatest = <T extends Item>(
  a: T,
  b: T,
  config?: Config<T>
) => {
  const sortingKey = config?.sortingKey || "publishedAt";

  return compareDesc(new Date(a[sortingKey]), new Date(b[sortingKey]));
};
