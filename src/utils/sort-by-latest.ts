import { compareDesc } from "date-fns";

type DateValue = string | number | Date;

interface Config<T, K extends keyof T> {
  sortingKey?: K;
}

type ItemWithPublishedAt = { publishedAt: DateValue };

export const sortByLatest = <
  T extends ItemWithPublishedAt,
  K extends keyof T = "publishedAt",
>(
  a: T,
  b: T,
  config?: Config<T, K>,
) => {
  const sortingKey = (config?.sortingKey ?? "publishedAt") as keyof T;
  const dateA = a[sortingKey] as DateValue;
  const dateB = b[sortingKey] as DateValue;

  return compareDesc(new Date(dateA), new Date(dateB));
};
