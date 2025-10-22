import { format, formatISO } from "date-fns";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/card";
import type { SelectPost } from "@/schema";

interface FeaturedPostsProps {
  featuredPosts: SelectPost[];
}

const FeaturedPosts = ({ featuredPosts }: FeaturedPostsProps) => {
  return (
    <div className="flex flex-col gap-8">
      <div className="font-bold text-pink-500 text-xl uppercase">
        Featured Posts
      </div>
      <div className="grid gap-4 md:auto-cols-fr md:grid-flow-col">
        {featuredPosts.slice(0, 3).map((post) => {
          if (!post.publishedAt) return null;

          const formattedDate = format(post.publishedAt, "iiii, dd MMMM yyyy");

          return (
            <Card key={post.id}>
              <Link
                href={post.metadata.canonical}
                className="flex h-full flex-col"
              >
                <CardHeader>
                  <time
                    dateTime={formatISO(post.publishedAt)}
                    title={formattedDate}
                    className="text-sm text-zinc-400 italic"
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
  );
};

export default FeaturedPosts;
