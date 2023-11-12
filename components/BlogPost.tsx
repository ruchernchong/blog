import Link from "next/link";
import { format, formatISO, parseISO } from "date-fns";
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import { H2 } from "@/components/Typography";

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
            <div className="absolute -inset-x-4 -inset-y-6 z-0 scale-95 rounded-2xl border border-indigo-300 opacity-0 transition group-hover:scale-100 group-hover:bg-neutral-800/25 group-hover:opacity-100" />
            <H2>{title}</H2>
          </Link>
          <p className="text-neutral-400">{excerpt}</p>
        </div>
        <time
          dateTime={formatISO(parseISO(publishedAt))}
          title={formattedDate}
          className="italic text-neutral-400"
        >
          {formattedDate}
        </time>
      </div>
      <div className="flex items-center">
        <div className="text-indigo-300">Read more</div>
        <ChevronRightIcon width={16} height={16} />
      </div>
    </div>
  );
};

export default BlogPost;
