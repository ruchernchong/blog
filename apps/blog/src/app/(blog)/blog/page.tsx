import { format, formatISO } from "date-fns";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { PopularPosts } from "@/app/(blog)/blog/_components/popular-posts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shared/card";
import { PageTitle } from "@/components/shared/page-title";
import { Typography } from "@/components/typography";
import { getPublishedPosts } from "@/lib/queries/posts";

export const metadata: Metadata = {
  title: "Blog",
  description: "My blog posts on coding, tech, and random thoughts.",
};

const BlogPage = async () => {
  const publishedPosts = await getPublishedPosts();

  return (
    <>
      <PageTitle
        title="Blog"
        description="My blog posts on coding, tech, and random thoughts."
        className="mb-8"
      />
      <div className="flex flex-col gap-12">
        <PopularPosts />
        <div className="flex flex-col gap-8">
          <Typography variant="label" className="text-foreground">
            All Posts
          </Typography>
          <div className="flex flex-col gap-4">
            {publishedPosts.length > 0 &&
              publishedPosts.map((post) => {
              if (!post.publishedAt) return null;

              const formattedDate = format(
                post.publishedAt,
                "iiii, dd MMMM yyyy",
              );

              return (
                <Card key={post.id}>
                  <Link
                    href={post.metadata.canonical as Route}
                    className="flex h-full flex-col"
                  >
                    <CardHeader>
                      <time
                        dateTime={formatISO(post.publishedAt)}
                        title={formattedDate}
                        className="text-sm text-muted-foreground italic"
                      >
                        {formattedDate}
                      </time>
                      <CardTitle className="capitalize">{post.title}</CardTitle>
                    </CardHeader>
                    <CardContent>{post.summary}</CardContent>
                  </Link>
                </Card>
              );
              })}
          </div>
        </div>
      </div>
    </>
  );
};

export default BlogPage;
