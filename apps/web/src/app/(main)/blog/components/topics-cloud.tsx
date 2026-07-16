import { Suspense } from "react";
import { getPublishedPosts } from "@/lib/queries/posts";
import { ActiveTopicPills, TopicPills } from "./topics-cloud-pills.client";

export async function TopicsCloud() {
  const allPosts = await getPublishedPosts();

  const counts = new Map<string, number>();
  for (const post of allPosts) {
    for (const tag of post.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  if (counts.size === 0) {
    return null;
  }

  const tags = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const maxCount = tags[0][1];

  // The tag counts come from cached data so this section prerenders. Only the
  // active-tag highlight depends on the request-time `?tag=`, so it is resolved
  // client-side: the Suspense fallback (default highlight) lands in the shell,
  // then ActiveTopicPills re-highlights the active tag after hydration.
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-semibold text-xl tracking-tight">Topics</h2>
      <Suspense fallback={<TopicPills tags={tags} maxCount={maxCount} />}>
        <ActiveTopicPills tags={tags} maxCount={maxCount} />
      </Suspense>
    </section>
  );
}
