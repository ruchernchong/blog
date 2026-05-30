import { Card } from "@heroui/react";
import { format, formatISO } from "date-fns";
import type { Route } from "next";
import Link from "next/link";
import type { SelectPost } from "@/schema";

interface FeaturedPostsProps {
  featuredPosts: SelectPost[];
}

const FeaturedPosts = ({ featuredPosts }: FeaturedPostsProps) => {
  return (
    <div className="flex flex-col gap-8">
      <div className="font-bold text-foreground text-xl uppercase">
        Featured Posts
      </div>
      <div className="grid gap-4 md:auto-cols-fr md:grid-flow-col">
        {featuredPosts.slice(0, 3).map((post) => {
          if (!post.publishedAt) return null;

          const formattedDate = format(post.publishedAt, "iiii, dd MMMM yyyy");

          return (
            <Card key={post.id}>
              <Link
                href={post.metadata.canonical as Route}
                className="flex h-full flex-col"
              >
                <Card.Header>
                  <time
                    dateTime={formatISO(post.publishedAt)}
                    title={formattedDate}
                    className="text-muted text-sm italic"
                  >
                    {formattedDate}
                  </time>
                  <Card.Title className="capitalize">{post.title}</Card.Title>
                </Card.Header>
                <Card.Content>{post.summary}</Card.Content>
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default FeaturedPosts;
