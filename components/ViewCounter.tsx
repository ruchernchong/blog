import { Redis } from "@upstash/redis";

interface Props {
  slug: string;
}

const redis = Redis.fromEnv();

const view = async (slug: string) => await redis.incr(`pageviews:${slug}`);

export const ViewCounter = async ({ slug }: Props) => {
  await view(slug);

  const views = (await redis.get<number>(`pageviews:${slug}`)) || 0;

  return <p className="text-sm text-neutral-400">{views} views</p>;
};
