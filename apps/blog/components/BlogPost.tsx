import { Typography } from "@/components/Typography";
import { ArrowRightIcon } from "@heroicons/react/20/solid";
import { format, formatISO, parseISO } from "date-fns";
import Link from "next/link";

interface BlogPostProps {
  title: string;
  canonical: string;
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
    <div
      className="group relative cursor-pointer"
      data-umami-event="blog-post-interaction"
      data-umami-event-title={title}
    >
      <div className="mb-4 flex flex-col-reverse md:flex-row md:justify-between">
        <div className="w-full basis-2/3">
          <Link
            href={canonical}
            className="group-hover:text-pink-500"
            data-umami-event="blog-post-title-click"
            data-umami-event-title={title}
            data-umami-event-url={canonical}
          >
            <Typography variant="h3" className="capitalize">
              {title}
            </Typography>
          </Link>
          <p
            className="line-clamp-2 text-zinc-400"
            data-umami-event="blog-post-excerpt-view"
            data-umami-event-title={title}
          >
            {excerpt}
          </p>
        </div>
        <time
          dateTime={formatISO(parseISO(publishedAt))}
          title={formattedDate}
          className="italic text-zinc-400"
          data-umami-event="blog-post-date-view"
          data-umami-event-title={title}
          data-umami-event-date={publishedAt}
        >
          {formattedDate}
        </time>
      </div>
      <div
        className="flex items-center gap-x-1"
        data-umami-event="blog-post-read-more"
        data-umami-event-title={title}
        data-umami-event-url={canonical}
      >
        Read more
        <ArrowRightIcon
          width={20}
          height={20}
          className="hidden text-pink-500 group-hover:block"
        />
      </div>
    </div>
  );
};

export default BlogPost;
