import { and, asc, count, desc, eq, isNull } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db, posts, series } from "@/schema";

export const getSeriesById = async (id: string) => {
  "use cache";
  cacheLife("max");
  cacheTag(`series:${id}`);

  return db.query.series.findFirst({
    where: eq(series.id, id),
  });
};

export const getSeriesBySlug = async (slug: string) => {
  return db.query.series.findFirst({
    where: and(eq(series.slug, slug), isNull(series.deletedAt)),
  });
};

export const getPublishedSeries = async () => {
  return db
    .select()
    .from(series)
    .where(and(eq(series.status, "published"), isNull(series.deletedAt)))
    .orderBy(desc(series.updatedAt));
};

export const getAllSeries = async () => {
  return db.select().from(series).orderBy(desc(series.updatedAt));
};

export const getPostsInSeries = async (seriesId: string) => {
  return db
    .select()
    .from(posts)
    .where(and(eq(posts.seriesId, seriesId), isNull(posts.deletedAt)))
    .orderBy(asc(posts.seriesOrder));
};

export const getPublishedPostsInSeries = async (seriesId: string) => {
  "use cache";
  cacheLife("max");
  cacheTag(`series:${seriesId}`);

  return db
    .select()
    .from(posts)
    .where(
      and(
        eq(posts.seriesId, seriesId),
        eq(posts.status, "published"),
        isNull(posts.deletedAt),
      ),
    )
    .orderBy(asc(posts.seriesOrder));
};

export const getPublishedSeriesWithPostCount = async () => {
  "use cache";
  cacheLife("max");
  cacheTag("series");

  const result = await db
    .select({
      id: series.id,
      slug: series.slug,
      title: series.title,
      description: series.description,
      coverImage: series.coverImage,
      postCount: count(posts.id),
    })
    .from(series)
    .leftJoin(
      posts,
      and(
        eq(posts.seriesId, series.id),
        eq(posts.status, "published"),
        isNull(posts.deletedAt),
      ),
    )
    .where(and(eq(series.status, "published"), isNull(series.deletedAt)))
    .groupBy(series.id)
    .orderBy(desc(series.updatedAt));

  return result;
};

export const getSeriesForSelector = async () => {
  "use cache";
  cacheLife("max");
  cacheTag("series");

  return db
    .select()
    .from(series)
    .where(isNull(series.deletedAt))
    .orderBy(desc(series.updatedAt));
};

export const getPublishedSeriesWithPosts = async () => {
  "use cache";
  cacheLife("max");
  cacheTag("series");

  const seriesList = await getPublishedSeriesWithPostCount();

  return await Promise.all(
    seriesList.map(async (series) => {
      const seriesPosts = await getPublishedPostsInSeries(series.id);
      return {
        ...series,
        posts: seriesPosts.map((p) => ({
          slug: p.slug,
          title: p.title,
        })),
      };
    }),
  );
};
