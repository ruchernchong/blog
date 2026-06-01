import { and, arrayOverlaps, eq, isNull, ne } from "drizzle-orm";
import { db, posts } from "@/schema";

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
