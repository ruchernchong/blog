import { TagIcon } from "@heroicons/react/24/outline";
import { format, formatISO } from "date-fns";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shared/card";
import { getRelatedPosts } from "@/lib/services/related-posts";

interface RelatedPostsProps {
  slug: string;
}

export const RelatedPosts = async ({ slug }: RelatedPostsProps) => {
  const relatedPosts = await getRelatedPosts(slug, 4);

  if (!relatedPosts.length) return null;

  return (
    <div className="not-prose mt-12 flex flex-col gap-8">
      <h2 className="font-bold text-2xl text-pink-500">Related Articles</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {relatedPosts.map((post) => {
          if (!post.publishedAt) return null;

          const formattedDate = format(post.publishedAt, "dd MMM yyyy");

          return (
            <Card key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="flex h-full flex-col"
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <time
                      dateTime={formatISO(post.publishedAt)}
                      title={formattedDate}
                      className="text-sm text-zinc-400"
                    >
                      {formattedDate}
                    </time>
                    <div className="flex items-center gap-2 text-pink-400 text-sm">
                      <TagIcon className="h-4 w-4" />
                      <span>
                        {post.commonTagCount}{" "}
                        {post.commonTagCount === 1 ? "tag" : "tags"}
                      </span>
                    </div>
                  </div>
                  <CardTitle className="capitalize">{post.title}</CardTitle>
                </CardHeader>
                <CardContent>{post.summary}</CardContent>
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
