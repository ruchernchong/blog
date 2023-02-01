import Link from "next/link";
import { format, formatISO, parseISO } from "date-fns";
import { Post } from "lib/types";

const BlogPost = ({ title, slug, excerpt, publishedDate }: Post) => {
  const formattedDate = format(parseISO(publishedDate), "dd MMM yyyy");

  return (
    <Link href={slug} className="w-full">
      <div className="mb-8 transition hover:opacity-50">
        <h3 className="mb-2 w-full flex-col text-xl font-medium md:flex md:flex-row md:items-center md:justify-between">
          <span>{title}</span>
          <time
            dateTime={formatISO(parseISO(publishedDate))}
            title={formattedDate}
            className="block text-sm italic text-neutral-600 dark:text-neutral-400"
          >
            {formattedDate}
          </time>
        </h3>
        <p className="text-neutral-600 dark:text-neutral-400">{excerpt}</p>
      </div>
    </Link>
  );
};
export default BlogPost;
