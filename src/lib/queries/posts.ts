import {
  and,
  arrayOverlaps,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  ne,
} from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db, posts } from "@/schema";

export const getPostBySlug = async (slug: string) => {
  const [post] = await db
    .select({ tags: posts.tags })
    .from(posts)
    .where(eq(posts.slug, slug))
    .limit(1);

  return post;
};

export const getPublishedPosts = async () => {
  "use cache";
  cacheLife("max");
  cacheTag("posts");

  return db
    .select()
    .from(posts)
    .where(and(eq(posts.status, "published"), isNull(posts.deletedAt)))
    .orderBy(desc(posts.publishedAt));
};

export async function getFeaturedPosts() {
  "use cache";
  cacheLife("max");
  cacheTag("posts");

  return db
    .select()
    .from(posts)
    .where(eq(posts.featured, true))
    .orderBy(desc(posts.createdAt));
}

export const getPublishedPostBySlug = async (slug: string) => {
  "use cache";
  cacheLife("max");
  cacheTag(`post:${slug}`);

  return db.query.posts.findFirst({
    with: {
      author: true,
    },
    where: and(
      eq(posts.slug, slug),
      eq(posts.status, "published"),
      isNull(posts.deletedAt),
    ),
  });
};

export const getPostBySlugForPreview = async (slug: string) => {
  return db.query.posts.findFirst({
    with: {
      author: true,
    },
    where: and(eq(posts.slug, slug), isNull(posts.deletedAt)),
  });
};

export const getPublishedPostSlugs = async () => {
  "use cache";
  cacheLife("max");
  cacheTag("posts");

  return db
    .select({ slug: posts.slug })
    .from(posts)
    .where(and(eq(posts.status, "published"), isNull(posts.deletedAt)));
};

export const getPublishedPostsBySlugs = async (slugs: string[]) => {
  "use cache";
  cacheLife("max");
  cacheTag("posts");

  return db
    .select()
    .from(posts)
    .where(
      and(
        inArray(posts.slug, slugs),
        eq(posts.status, "published"),
        isNotNull(posts.publishedAt),
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
