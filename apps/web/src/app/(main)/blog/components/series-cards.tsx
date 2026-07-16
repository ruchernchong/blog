import type { Route } from "next";
import Link from "next/link";
import { getPublishedSeriesWithPosts } from "@/lib/queries/series";

export async function SeriesCards() {
  const publishedSeries = await getPublishedSeriesWithPosts();

  if (publishedSeries.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-semibold text-xl tracking-tight">Series</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {publishedSeries.map((item) => {
          const firstPost = item.posts[0];

          return (
            <Link
              key={item.id}
              href={
                firstPost
                  ? (`/blog/${firstPost.slug}` as Route)
                  : ("/blog" as Route)
              }
              className="flex flex-col gap-1.5 rounded-xl border border-border p-4 transition-colors hover:bg-default/50"
            >
              <span className="font-mono text-muted text-xs">
                {item.postCount} {item.postCount === 1 ? "post" : "posts"}
              </span>
              <span className="font-semibold text-sm tracking-tight">
                {item.title}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
