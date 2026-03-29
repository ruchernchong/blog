import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format, formatISO, parseISO } from "date-fns";
import type { Route } from "next";
import Link from "next/link";
import { Typography } from "@/components/typography";

interface BlogPostProps {
  title: string;
  canonical: Route;
  excerpt: string;
  publishedAt: string;
}

const BlogPost = ({
  title,
  canonical,
  excerpt,
  publishedAt,
}: BlogPostProps) => {
  const formattedDate = format(parseISO(publishedAt), "iiii, dd MMMM yyyy");

  return (
    <div className="group relative cursor-pointer">
      <div className="mb-4 flex flex-col-reverse md:flex-row md:justify-between">
        <div className="w-full basis-2/3">
          <Link href={canonical} className="group-hover:text-muted-foreground">
            <Typography variant="h3" className="capitalize">
              {title}
            </Typography>
          </Link>
          <p className="line-clamp-2 text-muted-foreground">{excerpt}</p>
        </div>
        <time
          dateTime={formatISO(parseISO(publishedAt))}
          title={formattedDate}
          className="text-muted-foreground italic"
        >
          {formattedDate}
        </time>
      </div>
      <div className="flex items-center gap-2">
        Read more
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          size={20}
          strokeWidth={2}
          className="hidden text-foreground group-hover:block"
        />
      </div>
    </div>
  );
};

export default BlogPost;
