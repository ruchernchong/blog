import { and, arrayOverlaps, eq, inArray, isNull, ne } from "drizzle-orm";
import { db, posts } from "@/schema";

export const getPostBySlug = async (slug: string) => {
  const [post] = await db
    .select({ tags: posts.tags })
    .from(posts)
    .where(eq(posts.slug, slug))
    .limit(1);

  return post;
};

export const getPublishedPostsBySlugs = async (slugs: string[]) => {
  return db
    .select()
    .from(posts)
    .where(
      and(
        inArray(posts.slug, slugs),
        eq(posts.status, "published"),
        isNull(posts.deletedAt),
      ),
    );
};

export const getPostsWithOverlappingTags = async (
  tags: string[],
  excludeSlug: string,
) => {
  return db
    .select()
    .from(posts)
    .where(
      and(
        arrayOverlaps(posts.tags, tags),
        ne(posts.slug, excludeSlug),
        eq(posts.status, "published"),
        isNull(posts.deletedAt),
      ),
    );
};
