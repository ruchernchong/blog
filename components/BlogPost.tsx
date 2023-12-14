import Link from "next/link";
import { format, formatISO, parseISO } from "date-fns";
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import { ItemOverlay } from "@/components/ItemOverlay";
import { Typography } from "@/components/Typography";

type BlogPostProps = {
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string;
};

const BlogPost = ({ title, slug, excerpt, publishedAt }: BlogPostProps) => {
  const formattedDate = format(parseISO(publishedAt), "iiii, dd MMMM yyyy");

  return (
    <div className="group relative">
      <div className="mb-4 flex flex-col-reverse md:flex-row md:justify-between">
        <div className="w-full basis-2/3">
          <Link href={slug}>
            <ItemOverlay />
            <Typography variant="h2">{title}</Typography>
          </Link>
          <p className="text-gray-400">{excerpt}</p>
        </div>
        <time
          dateTime={formatISO(parseISO(publishedAt))}
          title={formattedDate}
          className="italic text-gray-400"
        >
          {formattedDate}
        </time>
      </div>
      <div className="flex items-center">
        <div className="text-pink-500">Read more</div>
        <ChevronRightIcon width={16} height={16} />
      </div>
    </div>
  );
};

export default BlogPost;
