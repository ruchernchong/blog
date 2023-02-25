import Link from "next/link";
import { format, formatISO, parseISO } from "date-fns";
import { ArrowSmallRightIcon } from "@heroicons/react/24/outline";
import { Post } from "lib/types";

const BlogPost = ({ title, slug, excerpt, publishedDate }: Post) => {
  const formattedDate = format(parseISO(publishedDate), "iiii, dd MMMM yyyy");

  return (
    <div className="w-full border-t py-8 dark:border-neutral-700">
      <div className="flex flex-col-reverse md:flex-row md:justify-between">
        <div className="w-full basis-2/3">
          <Link href={slug} className="hover:opacity-50">
            <h3 className="text-2xl font-medium md:mb-2">{title}</h3>
          </Link>
          <p className="mb-4 text-neutral-600 dark:text-neutral-400">
            {excerpt}
          </p>
        </div>
        <time
          dateTime={formatISO(parseISO(publishedDate))}
          title={formattedDate}
          className="italic text-neutral-600 dark:text-neutral-400"
        >
          {formattedDate}
        </time>
      </div>
      <Link href={slug} className="cursor-pointer text-lg">
        Continue reading{" "}
        <ArrowSmallRightIcon width={24} height={24} className="inline-block" />
      </Link>
    </div>
  );
};

export default BlogPost;
