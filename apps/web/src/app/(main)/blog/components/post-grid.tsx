import { formatISO } from "date-fns";
import { Suspense } from "react";
import { getPublishedPosts } from "@/lib/queries/posts";
import {
  ActivePostGrid,
  type GridPost,
  PostGridList,
} from "./post-grid-list.client";

export async function PostGrid() {
  const allPosts = await getPublishedPosts();

  // The full list comes from cached data, so this section prerenders into the
  // static shell. Only the active-tag filter depends on the request-time
  // `?tag=`, so it is resolved client-side: the Suspense fallback (default
  // "All Posts" view) lands in the shell, then ActivePostGrid re-filters to the
  // active tag after hydration.
  const posts: GridPost[] = allPosts
    .filter((post) => post.publishedAt)
    .map((post) => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      publishedAt: formatISO(post.publishedAt as Date),
      featured: post.featured,
      tags: post.tags ?? [],
    }));

  return (
    <Suspense fallback={<PostGridList posts={posts} />}>
      <ActivePostGrid posts={posts} />
    </Suspense>
  );
}
