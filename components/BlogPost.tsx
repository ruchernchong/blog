import Link from "next/link";
import { format, formatISO, parseISO } from "date-fns";
import { ArrowSmallRightIcon } from "@heroicons/react/24/outline";
import { Post } from "@/lib/types";

const BlogPost = ({ title, slug, excerpt, publishedDate }: Post) => {
  const formattedDate = format(parseISO(publishedDate), "iiii, dd MMMM yyyy");

  return (
    <div className="group relative flex flex-col-reverse md:flex-row md:justify-between">
      <div className="w-full basis-2/3">
        <Link href={slug}>
          <div className="absolute -inset-y-6 -inset-x-4 z-0 scale-95 rounded-2xl border border-neutral-600 opacity-0 transition group-hover:scale-100 group-hover:bg-neutral-800/25 group-hover:opacity-100" />
          <h3 className="text-2xl font-medium md:mb-2">{title}</h3>
        </Link>
        <p className="text-neutral-600 dark:text-neutral-400">{excerpt}</p>
      </div>
      <time
        dateTime={formatISO(parseISO(publishedDate))}
        title={formattedDate}
        className="italic text-neutral-600 dark:text-neutral-400"
      >
        {formattedDate}
      </time>
    </div>
  );
};

export default BlogPost;
