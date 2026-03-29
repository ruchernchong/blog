import { getPublishedPosts } from "@/lib/queries/posts";
import { LatestPostsClient } from "./latest-posts.client";

export async function LatestPosts() {
  const allPosts = await getPublishedPosts();
  const latestPosts = allPosts.slice(0, 3);

  return <LatestPostsClient posts={latestPosts} />;
}
